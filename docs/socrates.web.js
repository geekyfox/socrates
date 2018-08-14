var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Refs = /** @class */ (function () {
    function Refs() {
        this.yes = null;
        this.no = [];
        this.maybe = [];
        this.complete = false;
    }
    Refs.prototype.pushYes = function (entry) {
        this.yes = entry;
        this.complete = true;
    };
    Refs.prototype.isYes = function (entry) {
        if (this.yes == null) {
            return false;
        }
        return this.yes.id == entry.id;
    };
    Refs.prototype.pushNo = function (entry) {
        this.no.push(entry);
    };
    Refs.prototype.pushMaybe = function (entry) {
        this.maybe.push(entry);
    };
    Refs.prototype.contains = function (entry) {
        if (this.isYes(entry)) {
            return true;
        }
        if (this.no.some(function (x) { return x.id == entry.id; })) {
            return true;
        }
        if (this.maybe.some(function (x) { return x.id == entry.id; })) {
            return true;
        }
        return false;
    };
    Refs.prototype.relaxConstraints = function () {
        if (this.yes == null) {
            this.maybe = [];
            this.complete = false;
        }
    };
    Refs.prototype.isComplete = function () {
        return this.complete;
    };
    Refs.prototype.markComplete = function () {
        this.complete = true;
    };
    return Refs;
}());
var Entity = /** @class */ (function () {
    function Entity(model, id, text) {
        this.model = model;
        this.id = id;
        this.text = text;
        this.qtext = '"' + text + '"';
    }
    return Entity;
}());
var ActionsSet = /** @class */ (function () {
    function ActionsSet() {
        this.eliminate = new Refs();
        this.avoid = new Refs();
        this.ignore = new Refs();
        this.verify = new Refs();
    }
    ActionsSet.prototype.relaxConstraints = function () {
        this.eliminate.relaxConstraints();
        this.avoid.relaxConstraints();
        this.ignore.relaxConstraints();
        this.verify.relaxConstraints();
    };
    ActionsSet.prototype.containsYes = function (action) {
        if (this.eliminate.isYes(action)) {
            return true;
        }
        if (this.avoid.isYes(action)) {
            return true;
        }
        if (this.ignore.isYes(action)) {
            return true;
        }
        if (this.verify.isYes(action)) {
            return true;
        }
        return false;
    };
    ActionsSet.prototype.isValidVerify = function (action) {
        return this.isValidImpl(action, this.verify);
    };
    ActionsSet.prototype.isValidEliminate = function (action) {
        return this.isValidImpl(action, this.eliminate);
    };
    ActionsSet.prototype.isValidAvoid = function (action) {
        return this.isValidImpl(action, this.avoid);
    };
    ActionsSet.prototype.isValidIgnore = function (action) {
        return this.isValidImpl(action, this.ignore);
    };
    ActionsSet.prototype.isValidImpl = function (action, refs) {
        if (this.containsYes(action)) {
            return false;
        }
        if (refs.contains(action)) {
            return false;
        }
        return true;
    };
    ActionsSet.prototype.get = function (actionType) {
        switch (actionType) {
            case "eliminate" /* eliminate */:
                return this.eliminate;
            case "ignore" /* ignore */:
                return this.ignore;
            case "avoid" /* avoid */:
                return this.avoid;
            case "verify" /* verify */:
                return this.verify;
        }
        assertUnreachable(actionType);
    };
    return ActionsSet;
}());
var Issue = /** @class */ (function (_super) {
    __extends(Issue, _super);
    function Issue(model, text, bothersome) {
        var _this = _super.call(this, model, model.issues.length, text) || this;
        _this.reason = new Refs();
        _this.actions = new ActionsSet();
        _this.certainty = "unknown" /* unknown */;
        _this.bothersome = bothersome;
        return _this;
    }
    Issue.prototype.isIndirectlyCausedBy = function (cause) {
        var todo = [this];
        var seen = [];
        while (todo.length > 0) {
            var issue = todo.pop();
            if (seen.indexOf(issue.id) >= 0) {
                continue;
            }
            seen.push(issue.id);
            issue = issue.reason.yes;
            if (issue == null) {
                continue;
            }
            if (issue.id == cause.id) {
                return true;
            }
            todo.push(issue);
        }
        return false;
    };
    Issue.prototype.isPotentiallyCausedBy = function (cause) {
        if (this.id == cause.id) {
            return false;
        }
        if (this.reason.contains(cause)) {
            return false;
        }
        if (this.isIndirectlyCausedBy(cause)) {
            return false;
        }
        return true;
    };
    Issue.prototype.addReason = function (reasonText) {
        this.reason.pushYes(this.model.addNewIssue(reasonText, "maybe" /* maybe */));
    };
    Issue.prototype.addVerifyAction = function (text) {
        this.actions.verify.pushYes(this.model.addNewAction(text));
    };
    Issue.prototype.addEliminateAction = function (text) {
        this.actions.eliminate.pushYes(this.model.addNewAction(text));
    };
    Issue.prototype.addAvoidAction = function (text) {
        this.actions.avoid.pushYes(this.model.addNewAction(text));
    };
    Issue.prototype.addIgnoreAction = function (text) {
        this.actions.ignore.pushYes(this.model.addNewAction(text));
    };
    Issue.prototype.relaxConstraints = function () {
        this.reason.relaxConstraints();
        this.actions.relaxConstraints();
    };
    Issue.prototype.isFact = function () {
        return this.certainty == "fact" /* fact */;
    };
    Issue.prototype.isAssumption = function () {
        return this.certainty == "assumption" /* assumption */;
    };
    Issue.prototype.isEmotion = function () {
        return this.certainty == "emotion" /* emotion */;
    };
    Issue.prototype.isBelief = function () {
        return this.certainty == "belief" /* belief */;
    };
    return Issue;
}(Entity));
var Action = /** @class */ (function (_super) {
    __extends(Action, _super);
    function Action(model, text) {
        var _this = _super.call(this, model, model.actions.length, text) || this;
        _this.actionable = "maybe" /* maybe */;
        _this.blockers = new Refs();
        return _this;
    }
    Action.prototype.isPotentiallyBlockedBy = function (issue) {
        if (this.blockers.contains(issue)) {
            return false;
        }
        return true;
    };
    Action.prototype.addBlocker = function (issueText) {
        this.blockers.pushYes(this.model.addNewIssue(issueText, "maybe" /* maybe */));
    };
    Action.prototype.relaxConstraints = function () {
        this.blockers.relaxConstraints();
    };
    return Action;
}(Entity));
var ImmediateSolution = /** @class */ (function () {
    function ImmediateSolution(issue, action, actionType) {
        this.issue = issue;
        this.action = action;
        this.actionType = actionType;
    }
    ImmediateSolution.prototype.depth = function () {
        return 1;
    };
    return ImmediateSolution;
}());
var RootCauseSolution = /** @class */ (function () {
    function RootCauseSolution(issue, rootCauseSolution) {
        this.issue = issue;
        this.rootCauseSolution = rootCauseSolution;
    }
    RootCauseSolution.prototype.depth = function () {
        return this.rootCauseSolution.depth() + 1;
    };
    return RootCauseSolution;
}());
var UnblockSolution = /** @class */ (function () {
    function UnblockSolution(issue, action, actionType, unblockSolution) {
        this.issue = issue;
        this.actionType = actionType;
        this.action = this.issue.actions.get(actionType).yes;
        this.unblockSolution = unblockSolution;
    }
    UnblockSolution.prototype.depth = function () {
        return this.unblockSolution.depth() + 1;
    };
    return UnblockSolution;
}());
var Model = /** @class */ (function () {
    function Model() {
        this.reset();
    }
    Model.prototype.reset = function () {
        this.issues = [];
        this.actions = [];
        this.noMoreIssues = false;
    };
    Model.prototype.relaxConstraints = function () {
        this.noMoreIssues = false;
        for (var _i = 0, _a = this.issues; _i < _a.length; _i++) {
            var issue = _a[_i];
            issue.relaxConstraints();
        }
        for (var _b = 0, _c = this.actions; _b < _c.length; _b++) {
            var action = _c[_b];
            action.relaxConstraints();
        }
    };
    Model.prototype.addNewIssue = function (text, bothersome) {
        var issue = new Issue(this, text, bothersome);
        this.issues.push(issue);
        return issue;
    };
    Model.prototype.addNewAction = function (text) {
        var action = new Action(this, text);
        this.actions.push(action);
        return action;
    };
    Model.prototype.eachIssue = function (callback) {
        for (var ix = 0; ix < this.issues.length; ix++) {
            var ret = callback(this.issues[ix]);
            if (ret === false) {
                return false;
            }
        }
        return true;
    };
    return Model;
}());
var App = /** @class */ (function () {
    function App(platform) {
        this.platform = platform;
        this.view = new View(this);
        this.model = new Model();
        this.talker = new Talker(this);
        this.thinker = new Thinker(this);
    }
    App.prototype.think = function () {
        var idea = this.thinker.think();
        idea(this.talker);
    };
    App.prototype.start = function () {
        this.talker.start();
    };
    return App;
}());
var View = /** @class */ (function () {
    function View(app) {
        this.app = app;
        this.platform = app.platform;
        this.silenceFlag = false;
    }
    View.prototype.say = function (text) {
        this.platform.say(text);
        this.silenceFlag = false;
    };
    View.prototype.sayBullets = function (prefix, bullets, suffix) {
        this.platform.sayBullets(prefix, bullets, suffix);
        this.silenceFlag = false;
    };
    View.prototype.askOption = function (text, callback) {
        var _this = this;
        this.platform.askOption(text, function () {
            _this.platform.hear(text);
            _this.silenceFlag = true;
            if (callback) {
                callback();
            }
            if (_this.silenceFlag) {
                _this.app.think();
            }
        });
    };
    View.prototype.askInput = function (prefix, callback) {
        var _this = this;
        this.platform.askInput(prefix, function (text) {
            _this.platform.hear(prefix + " " + text);
            _this.silenceFlag = true;
            callback(text);
            if (_this.silenceFlag) {
                _this.app.think();
            }
        });
    };
    View.prototype.askNothing = function () {
        this.platform.askNothing();
    };
    return View;
}());
var Controller = /** @class */ (function () {
    function Controller(app) {
        this.app = app;
        this.view = app.view;
        this.model = app.model;
    }
    Controller.prototype.say = function (text) {
        if (Array.isArray(text)) {
            this.view.say(text.join(" "));
        }
        else {
            this.view.say(text);
        }
    };
    Controller.prototype.sayBullets = function (prefix, bullets, suffix) {
        this.view.sayBullets(prefix, bullets, suffix);
    };
    Controller.prototype.askYesNoMaybeAndPush = function (refs, entry) {
        this.askYesNoMaybe(function () { return refs.pushYes(entry); }, function () { return refs.pushNo(entry); }, function () { return refs.pushMaybe(entry); });
    };
    Controller.prototype.askYesNoMaybe = function (yes, no, maybe) {
        this.askYesNo(yes, no);
        this.askOption('Maybe', maybe);
    };
    Controller.prototype.askYesNo = function (yes, no) {
        this.askOption('Yes', yes);
        this.askOption('No', no);
    };
    Controller.prototype.askOption = function (text, callback) {
        if (callback === void 0) { callback = null; }
        this.view.askOption(text, callback);
    };
    Controller.prototype.askInput = function (prefix, callback) {
        this.view.askInput(prefix, callback);
    };
    Controller.prototype.askNothing = function () {
        this.view.askNothing();
    };
    return Controller;
}());
var AskIfIssueClosure = /** @class */ (function (_super) {
    __extends(AskIfIssueClosure, _super);
    function AskIfIssueClosure(app, issue) {
        var _this = _super.call(this, app) || this;
        _this.issue = issue;
        return _this;
    }
    AskIfIssueClosure.prototype.isCausedBy = function (cause) {
        this.say('Is ' + this.issue.qtext + ' caused by ' + cause.qtext + '?');
        this.askYesNoMaybeAndPush(this.issue.reason, cause);
    };
    AskIfIssueClosure.prototype.canBeVerified = function () {
        var _this = this;
        this.say([
            'Can you do something to verify if ' + this.issue.qtext,
            'is a correct assumption or a wrong one?'
        ]);
        this.askYesNo(function () {
            _this.say('Then tell me how would you do it');
            _this.askInput('I would', function (text) {
                _this.issue.addVerifyAction(text);
            });
        }, function () {
            _this.issue.certainty = "belief" /* belief */;
        });
    };
    AskIfIssueClosure.prototype.canBeEliminated = function () {
        var _this = this;
        this.say([
            'Is there a way you can eliminate ' + this.issue.qtext + '?'
        ]);
        this.askYesNo(function () {
            _this.say('Then tell me how would you do it');
            _this.askInput('I would', function (text) {
                _this.issue.addEliminateAction(text);
            });
        }, function () {
            _this.issue.actions.eliminate.markComplete();
        });
    };
    AskIfIssueClosure.prototype.canBeAvoided = function () {
        var _this = this;
        this.say([
            'Is there a way you can stop being affected by',
            this.issue.qtext + '?'
        ]);
        this.askYesNo(function () {
            _this.say('Then tell me how would you do it');
            _this.askInput('I would', function (text) {
                _this.issue.addAvoidAction(text);
            });
        }, function () {
            _this.issue.actions.avoid.markComplete();
        });
    };
    AskIfIssueClosure.prototype.canBeIgnored = function () {
        var _this = this;
        this.say([
            'Is there a way you can stop feeling negative about',
            this.issue.qtext + '?'
        ]);
        this.askYesNo(function () {
            _this.say('Then tell me how would you do it');
            _this.askInput('I would', function (text) {
                _this.issue.addIgnoreAction(text);
            });
        }, function () {
            _this.issue.actions.ignore.markComplete();
        });
    };
    AskIfIssueClosure.prototype.canBeVerifiedVia = function (action) {
        this.say([
            'Is ' + action.qtext + ' a good way to verify if',
            this.issue.qtext + ' is a correct assumption?'
        ]);
        this.askYesNoMaybeAndPush(this.issue.actions.verify, action);
    };
    AskIfIssueClosure.prototype.canBeEliminatedVia = function (action) {
        this.say([
            'Is ' + action.qtext + ' a good way to eliminate',
            this.issue.qtext + '?'
        ]);
        this.askYesNoMaybeAndPush(this.issue.actions.eliminate, action);
    };
    AskIfIssueClosure.prototype.canBeAvoidedVia = function (action) {
        this.say([
            'Is ', action.qtext, ' a good way to stop being affected by',
            this.issue.qtext + '?'
        ]);
        this.askYesNoMaybeAndPush(this.issue.actions.avoid, action);
    };
    AskIfIssueClosure.prototype.canBeIgnoredVia = function (action) {
        this.say([
            'Is', action.qtext, 'a good way to stop feeling negative about',
            this.issue.qtext + '?'
        ]);
        this.askYesNoMaybeAndPush(this.issue.actions.ignore, action);
    };
    AskIfIssueClosure.prototype.isCertain = function () {
        var _this = this;
        this.say('Is it true that ' + this.issue.qtext + '?');
        this.askOption('Yes, I\'m certain', function () {
            _this.issue.certainty = "fact" /* fact */;
        });
        this.askOption('I\'m not sure', function () {
            _this.issue.certainty = "assumption" /* assumption */;
        });
        this.askOption('It\'s just how I feel', function () {
            _this.issue.certainty = "emotion" /* emotion */;
        });
    };
    AskIfIssueClosure.prototype.hasKnownReason = function () {
        var _this = this;
        var text;
        if (this.issue.certainty == "emotion" /* emotion */) {
            text = 'Can you tell me why do feel that ' + this.issue.qtext + '?';
        }
        else if (this.issue.certainty == "belief" /* belief */) {
            text = 'Can you tell me why do think that ' + this.issue.qtext + '?';
        }
        else {
            text = 'Can you tell what is the reason for ' + this.issue.qtext + '?';
        }
        this.say(text);
        this.askYesNo(function () {
            _this.say('Then tell me what is that');
            _this.askInput('It is because', function (text) {
                _this.issue.addReason(text);
            });
        }, function () {
            _this.issue.reason.markComplete();
        });
    };
    AskIfIssueClosure.prototype.isBothersome = function () {
        var _this = this;
        this.say('Does it actually bother you that ' + this.issue.qtext + '?');
        this.askYesNo(function () { _this.issue.bothersome = "yes" /* yes */; }, function () { _this.issue.bothersome = "no" /* no */; });
    };
    return AskIfIssueClosure;
}(Controller));
var AskIfActionClosure = /** @class */ (function (_super) {
    __extends(AskIfActionClosure, _super);
    function AskIfActionClosure(app, action) {
        var _this = _super.call(this, app) || this;
        _this.action = action;
        return _this;
    }
    AskIfActionClosure.prototype.isActionable = function () {
        var _this = this;
        this.say('Can you actually do ' + this.action.qtext + '?');
        this.askYesNo(function () { _this.action.actionable = "yes" /* yes */; }, function () { _this.action.actionable = "no" /* no */; });
    };
    AskIfActionClosure.prototype.isBlockedBy = function (blocker) {
        this.say([
            'Is ' + this.action.qtext + " can't be done because of",
            blocker.qtext + '?'
        ]);
        this.askYesNoMaybeAndPush(this.action.blockers, blocker);
    };
    AskIfActionClosure.prototype.hasKnownBlockers = function () {
        var _this = this;
        this.say("Can you tell me why you can't do " + this.action.qtext + '?');
        this.askOption('Yes', function () {
            _this.say('Then tell me what is that');
            _this.askInput('It is because', function (text) {
                _this.action.addBlocker(text);
            });
        });
        this.askOption('No', function () {
            _this.action.blockers.markComplete();
        });
    };
    return AskIfActionClosure;
}(Controller));
var Talker = /** @class */ (function (_super) {
    __extends(Talker, _super);
    function Talker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Talker.prototype.askIfIssue = function (issue) {
        return new AskIfIssueClosure(this.app, issue);
    };
    Talker.prototype.askIfAction = function (action) {
        return new AskIfActionClosure(this.app, action);
    };
    Talker.prototype.start = function () {
        var _this = this;
        this.say('Hello!');
        this.askOption('Hello!', function () { return _this.givePrivacyNotice(); });
    };
    Talker.prototype.finish = function () {
        this.say('Sure, I understand. Have a nice day and come again.');
        this.askNothing();
    };
    Talker.prototype.givePrivacyNotice = function () {
        var _this = this;
        this.say([
            'Just so you understand: this program runs entirely',
            'in your browser and doesn\'t communicate with any remote',
            'servers whatsoever. Your information is stored in your own',
            'computer and never leaves it.'
        ]);
        this.say([
            'Obviously, privacy of your own computer is your own',
            'responsibility, and it\'s not something we can help you with.'
        ]);
        this.askOption('Yes, that\'s clear', function () {
            _this.giveDisclaimer();
        });
        this.askOption("Let's have a chat another time", function () {
            _this.finish();
        });
    };
    Talker.prototype.giveDisclaimer = function () {
        var _this = this;
        this.say([
            'Also, we claim no responsibility whatsoever for any positive',
            'or negative effects that this assisted brainstorming may have',
            'on your life. If you use our software, you do it on your own',
            'risk.'
        ]);
        this.askOption('Sure', function () {
            _this.giveIntroduction();
        });
        this.askOption("I don't feel comfortable with that", function () {
            _this.finish();
        });
    };
    Talker.prototype.giveIntroduction = function () {
        var _this = this;
        this.say('So, now we are going to have a conversation about ' +
            'difficulties in your life. Are you ready to proceed?');
        this.askOption('Yes, I\'m ready');
        this.askOption('Yes, but not right now', function () {
            _this.delayIntroduction();
        });
        this.askOption('No, I\'m not interested', function () {
            _this.finish();
        });
    };
    Talker.prototype.delayIntroduction = function () {
        this.say('Sure, tell me when you\'re ready');
        this.askOption('Yes, I\'m ready now');
    };
    Talker.prototype.getStuck = function () {
        var _this = this;
        this.say("I'm sorry, but I'm running out of ideas....");
        this.askOption('Okay, let\'s start from the beginning', function () {
            _this.model.reset();
        });
        this.askOption('Okay, let\'s review what we\'ve discussed', function () {
            _this.model.relaxConstraints();
        });
        this.askOption('You know, let\'s end here', function () {
            _this.finish();
        });
    };
    Talker.prototype.askForFirstIssue = function () {
        var _this = this;
        this.say('Okay, let\'s start. Tell me what bothers you?');
        this.askInput('It bothers me that', function (text) {
            _this.model.addNewIssue(text, "yes" /* yes */);
        });
    };
    Talker.prototype.askForMoreIssues = function () {
        var _this = this;
        this.say('Is there anything else that bothers you?');
        this.askOption('Yes', function () {
            _this.say('What is that?');
            _this.askInput('It also bothers me that', function (text) {
                _this.model.addNewIssue(text, "yes" /* yes */);
            });
        });
        this.askOption('No', function () {
            _this.model.noMoreIssues = true;
        });
    };
    Talker.prototype.suggestActionPlan = function (solutions) {
        var _this = this;
        var actions = solutions.map(function (x) { return _this.formatSolution(x); });
        this.sayBullets('Okay, so I propose you to do the following', actions, null);
        this.askOption('Sounds like a plan!', function () {
            _this.say('Great, then do it and come back later to discuss the results');
            _this.askNothing();
        });
        this.askOption("Let's review what we've discussed", function () {
            _this.model.relaxConstraints();
        });
    };
    Talker.prototype.formatSolution = function (s) {
        if (s instanceof ImmediateSolution) {
            return this.formatImmediateSolution(s);
        }
        if (s instanceof RootCauseSolution) {
            return this.formatRootCauseSolution(s);
        }
        return this.formatUnblockSolution(s);
    };
    Talker.prototype.formatImmediateSolution = function (s) {
        switch (s.actionType) {
            case "eliminate" /* eliminate */:
                return [
                    s.action.text, 'to eliminate',
                    s.issue.qtext
                ].join(' ');
            case "avoid" /* avoid */:
                return [
                    s.action.text, 'to stop being affected by',
                    s.issue.qtext
                ].join(' ');
            case "ignore" /* ignore */:
                return [
                    s.action.text, 'to stop feeling negative about',
                    s.issue.qtext
                ].join(' ');
            case "verify" /* verify */:
                return [
                    s.action.text, 'to make clear if',
                    s.issue.qtext, 'is true or not'
                ].join(' ');
        }
        assertUnreachable(s.actionType);
    };
    Talker.prototype.formatRootCauseSolution = function (s) {
        return [
            this.formatSolution(s.rootCauseSolution) + '.',
            'That will indirectly resolve',
            s.issue.qtext
        ].join(' ');
    };
    Talker.prototype.formatUnblockSolution = function (s) {
        return [
            this.formatSolution(s.unblockSolution) + '.',
            'This will enable you to',
            this.formatImmediateSolution(s)
        ].join(' ');
    };
    return Talker;
}(Controller));
var Thinker = /** @class */ (function () {
    function Thinker(app) {
        this.model = app.model;
        this.ideas = [];
        this.noIdeasFlag = true;
        this.solutionSeeker = new SolutionSeeker();
    }
    Thinker.prototype.think = function () {
        this.thinkImpl();
        if (this.ideas.length == 0) {
            return function (t) { return t.getStuck(); };
        }
        var ix = Math.floor(Math.random() * this.ideas.length);
        return this.ideas[ix];
    };
    Thinker.prototype.addIdea = function (idea) {
        this.ideas.push(idea);
        this.noIdeasFlag = false;
    };
    Thinker.prototype.thinkImpl = function () {
        this.ideas = [];
        if (this.produceActionPlan()) {
            return;
        }
        this.askForAdditionalIssues();
        for (var _i = 0, _a = this.model.issues; _i < _a.length; _i++) {
            var issue = _a[_i];
            this.thinkAboutIssue(issue);
        }
        for (var _b = 0, _c = this.model.actions; _b < _c.length; _b++) {
            var action = _c[_b];
            this.thinkAboutAction(action);
        }
    };
    Thinker.prototype.produceActionPlan = function () {
        if (!this.model.noMoreIssues) {
            return false;
        }
        var actionPlan = [];
        var isComplete = true;
        for (var _i = 0, _a = this.model.issues; _i < _a.length; _i++) {
            var issue = _a[_i];
            if (issue.bothersome == "maybe" /* maybe */) {
                isComplete = false;
                continue;
            }
            if (issue.bothersome == "no" /* no */) {
                continue;
            }
            var solution = this.solutionSeeker.find(issue);
            if (solution == null) {
                isComplete = false;
            }
            else {
                actionPlan.push(solution);
            }
        }
        if (isComplete) {
            this.addIdea(function (t) { return t.suggestActionPlan(actionPlan); });
        }
        return isComplete;
    };
    Thinker.prototype.askForAdditionalIssues = function () {
        if (this.model.noMoreIssues) {
            return;
        }
        if (this.model.issues.length == 0) {
            this.addIdea(function (t) { return t.askForFirstIssue(); });
        }
        else {
            this.addIdea(function (t) { return t.askForMoreIssues(); });
        }
    };
    Thinker.prototype.thinkAboutIssue = function (issue) {
        if (issue.bothersome == "maybe" /* maybe */) {
            this.addIdea(function (t) { return t.askIfIssue(issue).isBothersome(); });
        }
        if (issue.certainty == "unknown" /* unknown */) {
            this.addIdea(function (t) { return t.askIfIssue(issue).isCertain(); });
            return;
        }
        var rules = new IssueRules(issue);
        if (rules.mayHaveReasons()) {
            this.thinkAboutReasonsOfIssue(issue);
        }
        if (rules.mayHaveEliminateActions()) {
            this.suggestEliminateActions(issue);
        }
        if (rules.mayHaveAvoidActions()) {
            this.suggestAvoidActions(issue);
        }
        if (rules.mayHaveIgnoreActions()) {
            this.suggestIgnoreActions(issue);
        }
        if (rules.mayHaveVerifyActions()) {
            this.suggestVerifyActions(issue);
        }
    };
    Thinker.prototype.thinkAboutAction = function (action) {
        switch (action.actionable) {
            case "yes" /* yes */:
                break;
            case "no" /* no */:
                this.thinkAboutBlockersOfAction(action);
                break;
            case "maybe" /* maybe */:
                this.addIdea(function (t) { return t.askIfAction(action).isActionable(); });
                break;
            default:
                assertUnreachable(action.actionable);
        }
    };
    Thinker.prototype.thinkAboutReasonsOfIssue = function (issue) {
        if (issue.reason.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        this.suggestReasonsAmongKnownIssues(issue);
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfIssue(issue).hasKnownReason(); });
        }
    };
    Thinker.prototype.thinkAboutBlockersOfAction = function (action) {
        if (action.blockers.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        this.suggestBlockersAmongKnownIssues(action);
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfAction(action).hasKnownBlockers(); });
        }
    };
    Thinker.prototype.suggestVerifyActions = function (issue) {
        if (issue.actions.verify.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        var _loop_1 = function (action) {
            if (issue.actions.isValidVerify(action)) {
                this_1.addIdea(function (t) { return t.askIfIssue(issue).canBeVerifiedVia(action); });
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = this.model.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            _loop_1(action);
        }
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfIssue(issue).canBeVerified(); });
        }
    };
    Thinker.prototype.suggestEliminateActions = function (issue) {
        if (issue.actions.eliminate.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        var _loop_2 = function (action) {
            if (issue.actions.isValidEliminate(action)) {
                this_2.addIdea(function (t) { return t.askIfIssue(issue).canBeEliminatedVia(action); });
            }
        };
        var this_2 = this;
        for (var _i = 0, _a = this.model.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            _loop_2(action);
        }
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfIssue(issue).canBeEliminated(); });
        }
    };
    Thinker.prototype.suggestAvoidActions = function (issue) {
        if (issue.actions.avoid.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        var _loop_3 = function (action) {
            if (issue.actions.isValidAvoid(action)) {
                this_3.addIdea(function (t) { return t.askIfIssue(issue).canBeAvoidedVia(action); });
            }
        };
        var this_3 = this;
        for (var _i = 0, _a = this.model.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            _loop_3(action);
        }
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfIssue(issue).canBeAvoided(); });
        }
    };
    Thinker.prototype.suggestIgnoreActions = function (issue) {
        if (issue.actions.ignore.isComplete()) {
            return;
        }
        this.noIdeasFlag = true;
        var _loop_4 = function (action) {
            if (issue.actions.isValidIgnore(action)) {
                this_4.addIdea(function (t) { return t.askIfIssue(issue).canBeIgnoredVia(action); });
            }
        };
        var this_4 = this;
        for (var _i = 0, _a = this.model.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            _loop_4(action);
        }
        if (this.noIdeasFlag) {
            this.addIdea(function (t) { return t.askIfIssue(issue).canBeIgnored(); });
        }
    };
    Thinker.prototype.suggestReasonsAmongKnownIssues = function (issue) {
        var _loop_5 = function (otherIssue) {
            if (issue.isPotentiallyCausedBy(otherIssue)) {
                this_5.addIdea(function (t) { return t.askIfIssue(issue).isCausedBy(otherIssue); });
            }
        };
        var this_5 = this;
        for (var _i = 0, _a = this.model.issues; _i < _a.length; _i++) {
            var otherIssue = _a[_i];
            _loop_5(otherIssue);
        }
    };
    Thinker.prototype.suggestBlockersAmongKnownIssues = function (action) {
        var _loop_6 = function (issue) {
            if (action.isPotentiallyBlockedBy(issue)) {
                this_6.addIdea(function (t) { return t.askIfAction(action).isBlockedBy(issue); });
            }
        };
        var this_6 = this;
        for (var _i = 0, _a = this.model.issues; _i < _a.length; _i++) {
            var issue = _a[_i];
            _loop_6(issue);
        }
    };
    return Thinker;
}());
var IssueRules = /** @class */ (function () {
    function IssueRules(issue) {
        this.issue = issue;
    }
    IssueRules.prototype.mayHaveReasons = function () {
        return this.issue.isFact() || this.issue.isEmotion() || this.issue.isBelief();
    };
    IssueRules.prototype.mayHaveEliminateActions = function () {
        return this.issue.isFact() || this.issue.isEmotion();
    };
    IssueRules.prototype.mayHaveAvoidActions = function () {
        return this.issue.isFact() || this.issue.isBelief();
    };
    IssueRules.prototype.mayHaveIgnoreActions = function () {
        return this.issue.isFact() || this.issue.isEmotion();
    };
    IssueRules.prototype.mayHaveVerifyActions = function () {
        return this.issue.isAssumption();
    };
    IssueRules.prototype.getApplicableActionTypes = function () {
        var types = [];
        if (this.mayHaveEliminateActions()) {
            types.push("eliminate" /* eliminate */);
        }
        if (this.mayHaveAvoidActions()) {
            types.push("avoid" /* avoid */);
        }
        if (this.mayHaveIgnoreActions()) {
            types.push("ignore" /* ignore */);
        }
        if (this.mayHaveVerifyActions()) {
            types.push("verify" /* verify */);
        }
        return types;
    };
    return IssueRules;
}());
var SolutionSeeker = /** @class */ (function () {
    function SolutionSeeker() {
    }
    SolutionSeeker.prototype.find = function (issue) {
        return this.findImpl(issue, []);
    };
    SolutionSeeker.prototype.findImpl = function (issue, stack) {
        if (stack.indexOf(issue.id) >= 0) {
            return null;
        }
        var immediate = this.findImmediate(issue);
        if (immediate != null) {
            return immediate;
        }
        var rootCause = this.findRootCause(issue, stack);
        var unblock = this.findUnblock(issue, stack);
        return this.chooseOptimal([rootCause, unblock]);
    };
    SolutionSeeker.prototype.findImmediate = function (issue) {
        var applicable = new IssueRules(issue).getApplicableActionTypes();
        var options = [];
        for (var _i = 0, applicable_1 = applicable; _i < applicable_1.length; _i++) {
            var actionType = applicable_1[_i];
            var action = issue.actions.get(actionType).yes;
            if ((action == null) || (action.actionable != "yes" /* yes */)) {
                continue;
            }
            options.push(new ImmediateSolution(issue, action, actionType));
        }
        return this.chooseOptimal(options);
    };
    SolutionSeeker.prototype.findRootCause = function (issue, stack) {
        if (issue.reason.yes == null) {
            return null;
        }
        var s = this.findImpl(issue.reason.yes, stack.concat([issue.id]));
        if (s == null) {
            return null;
        }
        return new RootCauseSolution(issue, s);
    };
    SolutionSeeker.prototype.findUnblock = function (issue, stack) {
        var applicable = new IssueRules(issue).getApplicableActionTypes();
        var options = [];
        for (var _i = 0, applicable_2 = applicable; _i < applicable_2.length; _i++) {
            var actionType = applicable_2[_i];
            var action = issue.actions.get(actionType).yes;
            if (action == null) {
                continue;
            }
            if (action.blockers.yes == null) {
                continue;
            }
            var s = this.findImpl(action.blockers.yes, stack.concat([issue.id]));
            if (s != null) {
                options.push(new UnblockSolution(issue, action, actionType, s));
            }
        }
        return this.chooseOptimal(options);
    };
    SolutionSeeker.prototype.chooseOptimal = function (options) {
        var nonNull = options.filter(function (x) { return x != null; });
        if (nonNull.length == 0) {
            return null;
        }
        if (nonNull.length == 1) {
            return nonNull[0];
        }
        var optimal = [];
        for (var _i = 0, nonNull_1 = nonNull; _i < nonNull_1.length; _i++) {
            var x = nonNull_1[_i];
            if (optimal.length > 0) {
                var delta = x.depth() - optimal[0].depth();
                if (delta > 0) {
                    continue;
                }
                if (delta < 0) {
                    optimal = [];
                }
            }
            optimal.push(x);
        }
        var ix = Math.floor(Math.random() * optimal.length);
        return optimal[ix];
    };
    return SolutionSeeker;
}());
function assertUnreachable(x) {
    throw new Error("Didn't expect to get here");
}
var Web = /** @class */ (function () {
    function Web() {
    }
    Web.prototype.say = function (arg) {
        this.phrase('say', arg);
    };
    Web.prototype.hear = function (arg) {
        $('#reply-pane').empty();
        this.phrase('hear', arg);
    };
    Web.prototype.sayBullets = function (prefix, items, suffix) {
        var element = $('<div class="phrase"/>').text(prefix);
        var list = $('<ul/>');
        for (var ix = 0; ix < items.length; ix++) {
            var listItem = $('<li/>').text(items[ix]);
            list.append(listItem);
        }
        element.append(list);
        if (suffix) {
            element.append($('<span>').text(suffix));
        }
        this.phraseImpl('say', element);
    };
    Web.prototype.askOption = function (text, callback) {
        if (!callback) {
            throw callback.toString();
        }
        var elem = $('<button/>').text(text).click(callback);
        $('#reply-pane').append(elem);
    };
    Web.prototype.askInput = function (prefix, callback) {
        var submit = $('<button>Submit</button>')
            .prop('disabled', true)
            .click(function () {
            var val = input.val().toString().trim();
            callback(val);
        });
        var input = $('<input type="text" />')
            .keyup(function (evt) {
            var flag = input.val().toString().trim() ? false : true;
            submit.prop('disabled', flag);
            if ((!flag) && (evt.key === 'Enter')) {
                submit.click();
            }
        });
        var wrapper = $('<span/>');
        if (prefix) {
            wrapper.append(prefix);
            wrapper.append('&nbsp;');
        }
        wrapper.append(input);
        wrapper.append(submit);
        $('#reply-pane').append(wrapper);
    };
    Web.prototype.askNothing = function () {
        $('#reply-pane').hide();
    };
    Web.prototype.phrase = function (cssClass, text) {
        var element = $('<div class="phrase"/>').text(text);
        this.phraseImpl(cssClass, element);
    };
    Web.prototype.phraseImpl = function (cssClass, element) {
        var wrapper = $('<div class="phrase-wrapper clearfix"/>')
            .addClass(cssClass)
            .append(element);
        $('#reply-pane').before(wrapper);
    };
    return Web;
}());
//# sourceMappingURL=socrates.web.js.map