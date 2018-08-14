class AskIfIssueClosure extends Controller {
    private readonly issue: Issue

    constructor(app: App, issue: Issue) {
        super(app)
        this.issue = issue
    }

    isCausedBy(cause: Issue) : void {
        this.say('Is ' + this.issue.qtext + ' caused by ' + cause.qtext + '?')
        this.askYesNoMaybeAndPush(this.issue.reason, cause)
    }

    canBeVerified() : void {
        this.say([
            'Can you do something to verify if ' + this.issue.qtext,
            'is a correct assumption or a wrong one?'
        ])
        this.askYesNo(
            () => {
                this.say('Then tell me how would you do it')
                this.askInput('I would', (text) => {
                    this.issue.addVerifyAction(text)
                })
            },
            () => {
                this.issue.certainty = Certainty.belief
            }            
        )
    }
    
    canBeEliminated() : void {
        this.say([
            'Is there a way you can eliminate ' + this.issue.qtext + '?'
        ])
        this.askYesNo(
            () => {
                this.say('Then tell me how would you do it')
                this.askInput('I would', (text) => {
                    this.issue.addEliminateAction(text)
                })
            },
            () => {
                this.issue.actions.eliminate.markComplete()
            }
        )
    }

    canBeAvoided() : void {
        this.say([
            'Is there a way you can stop being affected by',
            this.issue.qtext + '?'
        ])
        this.askYesNo(
            () => {
                this.say('Then tell me how would you do it')
                this.askInput('I would', (text) => {
                    this.issue.addAvoidAction(text)
                })
            },
            () => {
                this.issue.actions.avoid.markComplete()
            }
        )
    }

    canBeIgnored() : void {
        this.say([
            'Is there a way you can stop feeling negative about',
            this.issue.qtext + '?'
        ])
        this.askYesNo(
            () => {
                this.say('Then tell me how would you do it')
                this.askInput('I would', (text) => {
                    this.issue.addIgnoreAction(text)
                })
            },
            () => {
                this.issue.actions.ignore.markComplete()
            }
        )
    }

    canBeVerifiedVia(action: Action) : void {
        this.say([
            'Is ' + action.qtext + ' a good way to verify if',
            this.issue.qtext + ' is a correct assumption?'
        ])
        this.askYesNoMaybeAndPush(this.issue.actions.verify, action)
    }
    
    canBeEliminatedVia(action: Action) : void {
        this.say([
            'Is ' + action.qtext + ' a good way to eliminate',
            this.issue.qtext + '?'
        ])
        this.askYesNoMaybeAndPush(this.issue.actions.eliminate, action)
    }
    
    canBeAvoidedVia(action: Action) : void {
        this.say([
            'Is ', action.qtext, ' a good way to stop being affected by',
            this.issue.qtext + '?'
        ])
        this.askYesNoMaybeAndPush(this.issue.actions.avoid, action)
    }

    canBeIgnoredVia(action: Action) : void {
        this.say([
            'Is', action.qtext, 'a good way to stop feeling negative about',
            this.issue.qtext + '?'
        ])
        this.askYesNoMaybeAndPush(this.issue.actions.ignore, action)
    }

    isCertain() : void {
        this.say('Is it true that ' + this.issue.qtext + '?')
        this.askOption('Yes, I\'m certain', () => {
            this.issue.certainty = Certainty.fact
        })
        this.askOption('I\'m not sure', () => {
            this.issue.certainty = Certainty.assumption
        })
        this.askOption('It\'s just how I feel', () => {
            this.issue.certainty = Certainty.emotion
        })
    }

    hasKnownReason() : void {
        var text
        if (this.issue.certainty == Certainty.emotion) {
            text = 'Can you tell me why do feel that ' + this.issue.qtext + '?'
        } else if (this.issue.certainty == Certainty.belief) {
            text = 'Can you tell me why do think that ' + this.issue.qtext + '?'
        } else {
            text = 'Can you tell what is the reason for ' + this.issue.qtext + '?'
        }
        this.say(text)
        this.askYesNo(
            () => {
                this.say('Then tell me what is that')
                this.askInput('It is because', (text) => {
                    this.issue.addReason(text)
                })
            },
            () => {
                this.issue.reason.markComplete()                
            }
        )
    }
    
    isBothersome() {
        this.say('Does it actually bother you that ' + this.issue.qtext + '?')
        this.askYesNo(
            () => { this.issue.bothersome = Trinary.yes },
            () => { this.issue.bothersome = Trinary.no }
        )
    }
}

class AskIfActionClosure extends Controller {
    private readonly action: Action

    constructor(app: App, action: Action) {
        super(app)
        this.action = action
    }
    
    isActionable() : void {
        this.say('Can you actually do ' + this.action.qtext + '?')
        this.askYesNo(
            () => { this.action.actionable = Trinary.yes },
            () => { this.action.actionable = Trinary.no }
        )
    }
    
    isBlockedBy(blocker: Issue) : void {
        this.say([
            'Is ' + this.action.qtext + " can't be done because of",
            blocker.qtext + '?'
        ])
        this.askYesNoMaybeAndPush(this.action.blockers, blocker)
    }

    hasKnownBlockers() : void {
        this.say("Can you tell me why you can't do " + this.action.qtext + '?')
        this.askOption('Yes', () => {
            this.say('Then tell me what is that')
            this.askInput('It is because', (text) => {
                this.action.addBlocker(text)
            })
        })
        this.askOption('No', () => {
            this.action.blockers.markComplete()
        })
    }
}

class Talker extends Controller {    
    askIfIssue(issue: Issue) : AskIfIssueClosure {
        return new AskIfIssueClosure(this.app, issue)
    }
    
    askIfAction(action: Action) : AskIfActionClosure {
        return new AskIfActionClosure(this.app, action)
    }
    
    start() : void {
        this.say('Hello!')
        this.askOption('Hello!', () => this.givePrivacyNotice())
    }

    finish() : void {
        this.say('Sure, I understand. Have a nice day and come again.')
        this.askNothing()
    }

    givePrivacyNotice() : void {
        this.say([
            'Just so you understand: this program runs entirely',
            'in your browser and doesn\'t communicate with any remote',
            'servers whatsoever. Your information is stored in your own',
            'computer and never leaves it.'
        ])
        this.say([
            'Obviously, privacy of your own computer is your own',
            'responsibility, and it\'s not something we can help you with.'
        ])
        this.askOption('Yes, that\'s clear', () => {
            this.giveDisclaimer()
        })
        this.askOption("Let's have a chat another time", () => {
            this.finish()
        })
    }

    giveDisclaimer() : void {
        this.say([
            'Also, we claim no responsibility whatsoever for any positive',
            'or negative effects that this assisted brainstorming may have',
            'on your life. If you use our software, you do it on your own',
            'risk.'
        ])
        this.askOption('Sure', () => {
            this.giveIntroduction()
        })
        this.askOption("I don't feel comfortable with that", () => {
            this.finish()
        })
    }

    giveIntroduction() : void {
        this.say(
            'So, now we are going to have a conversation about ' +
            'difficulties in your life. Are you ready to proceed?'
        )
        this.askOption('Yes, I\'m ready')
        this.askOption('Yes, but not right now', () => {
            this.delayIntroduction()
        })
        this.askOption('No, I\'m not interested', () => {
            this.finish()
        })
    }

    delayIntroduction() : void {
        this.say('Sure, tell me when you\'re ready')
        this.askOption('Yes, I\'m ready now')
    }
    
    getStuck() : void {
        this.say("I'm sorry, but I'm running out of ideas....")
        this.askOption('Okay, let\'s start from the beginning', () => {
            this.model.reset()
        })
        this.askOption('Okay, let\'s review what we\'ve discussed', () => {
            this.model.relaxConstraints()
        })
        this.askOption('You know, let\'s end here', () => {
            this.finish()
        })
    }

    askForFirstIssue() : void {
        this.say('Okay, let\'s start. Tell me what bothers you?')
        this.askInput('It bothers me that', (text) => {
            this.model.addNewIssue(text, Trinary.yes)
        })
    }

    askForMoreIssues() : void {
        this.say('Is there anything else that bothers you?')
        this.askOption('Yes', () => {
            this.say('What is that?')
            this.askInput('It also bothers me that', (text) => {
                this.model.addNewIssue(text, Trinary.yes)
            })
        })
        this.askOption('No', () => {
            this.model.noMoreIssues = true
        })
    }

    suggestActionPlan(solutions: Solution[]) : void {
        let actions = solutions.map((x) => this.formatSolution(x))
        this.sayBullets(
            'Okay, so I propose you to do the following',
            actions,
            null
        )
        this.askOption('Sounds like a plan!', () => {
            this.say('Great, then do it and come back later to discuss the results')
            this.askNothing()
        })
        this.askOption("Let's review what we've discussed", () => {
            this.model.relaxConstraints()
        })
    }
    
    formatSolution(s: Solution) : string {
        if (s instanceof ImmediateSolution) {
            return this.formatImmediateSolution(s)
        }
        if (s instanceof RootCauseSolution) {
            return this.formatRootCauseSolution(s)
        }
        return this.formatUnblockSolution(s)
    }
    
    formatImmediateSolution(s: ImmediateSolution) : string {
        switch (s.actionType) {
        case ActionType.eliminate:
            return [
                s.action.text, 'to eliminate',
                s.issue.qtext
            ].join(' ')
        case ActionType.avoid:
            return [
                s.action.text, 'to stop being affected by',
                s.issue.qtext
            ].join(' ')
        case ActionType.ignore:
            return [
                s.action.text, 'to stop feeling negative about',
                s.issue.qtext
            ].join(' ')
        case ActionType.verify:
            return [
                s.action.text, 'to make clear if',
                s.issue.qtext, 'is true or not'
            ].join(' ')
        }
        assertUnreachable(s.actionType)
    }
    
    formatRootCauseSolution(s: RootCauseSolution) : string {
        return [
            this.formatSolution(s.rootCauseSolution) + '.',
            'That will indirectly resolve',
            s.issue.qtext
        ].join(' ')
    }
    
    formatUnblockSolution(s: UnblockSolution) : string {
        return [
            this.formatSolution(s.unblockSolution) + '.',
            'This will enable you to',
            this.formatImmediateSolution(s)
        ].join(' ')
    }
}
