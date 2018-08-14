const enum Certainty {
    unknown = 'unknown',
    fact = 'fact',
    assumption = 'assumption',
    emotion = 'emotion',
    belief = 'belief',
}

const enum Trinary {
    yes = 'yes',
    no = 'no',
    maybe = 'maybe'
}

interface Indexed {
    id: number
}

class Refs<T extends Indexed> {
    yes: T
    no: T[]
    maybe: T[]
    private complete: boolean
    
    constructor() {
        this.yes = null
        this.no = []
        this.maybe = []
        this.complete = false
    }
    
    pushYes(entry : T) : void {
        this.yes = entry
        this.complete = true
    }

    isYes(entry : T) : boolean {
        if (this.yes == null) {
            return false
        }
        return this.yes.id == entry.id
    }
    
    pushNo(entry : T) : void {
        this.no.push(entry)
    }
    
    pushMaybe(entry : T) : void {
        this.maybe.push(entry)
    }
    
    contains(entry : T) : boolean {
        if (this.isYes(entry)) {
            return true
        }
        if (this.no.some((x) => x.id == entry.id)) {
            return true
        }
        if (this.maybe.some((x) => x.id == entry.id)) {
            return true
        }
        return false
    }
    
    relaxConstraints() : void {
        if (this.yes == null) {
            this.maybe = []
            this.complete = false
        }
    }
    
    isComplete() : boolean {
        return this.complete
    }
    
    markComplete() : void {
        this.complete = true
    }
}

class Entity implements Indexed {
    protected readonly model: Model
    readonly id: number
    readonly text: string
    readonly qtext: string
    
    constructor(model: Model, id:number, text:string) {
        this.model = model
        this.id = id
        this.text = text
        this.qtext = '"' + text + '"'
    }
}

const enum ActionType {
    eliminate = 'eliminate',
    avoid = 'avoid',
    ignore = 'ignore',
    verify = 'verify',
}

class ActionsSet {
    readonly eliminate: Refs<Action>
    readonly avoid: Refs<Action>
    readonly ignore: Refs<Action>
    readonly verify: Refs<Action>
    
    constructor() {
        this.eliminate = new Refs()
        this.avoid = new Refs()
        this.ignore = new Refs()
        this.verify = new Refs()
    }

    relaxConstraints() : void {
        this.eliminate.relaxConstraints()
        this.avoid.relaxConstraints()
        this.ignore.relaxConstraints()
        this.verify.relaxConstraints()
    }

    containsYes(action: Action) : boolean {
        if (this.eliminate.isYes(action)) {
            return true
        }
        if (this.avoid.isYes(action)) {
            return true
        }
        if (this.ignore.isYes(action)) {
            return true
        }
        if (this.verify.isYes(action)) {
            return true
        }
        return false
    }

    isValidVerify(action: Action) : boolean {
        return this.isValidImpl(action, this.verify)
    }

    isValidEliminate(action: Action) : boolean {
        return this.isValidImpl(action, this.eliminate)
    }

    isValidAvoid(action: Action) : boolean {
        return this.isValidImpl(action, this.avoid)
    }

    isValidIgnore(action: Action) : boolean {
        return this.isValidImpl(action, this.ignore)
    }

    private isValidImpl(action: Action, refs: Refs<Action>) : boolean {
        if (this.containsYes(action)) {
            return false
        }
        if (refs.contains(action)) {
            return false
        }
        return true
    }
    
    get(actionType: ActionType) : Refs<Action> {
        switch (actionType) {
        case ActionType.eliminate:
            return this.eliminate;
        case ActionType.ignore:
            return this.ignore;
        case ActionType.avoid:
            return this.avoid;
        case ActionType.verify:
            return this.verify;
        }
        assertUnreachable(actionType)
    }
}

class Issue extends Entity {
    readonly reason: Refs<Issue>
    readonly actions: ActionsSet
    certainty: Certainty
    bothersome: Trinary
    
    constructor(model: Model, text: string, bothersome: Trinary) {
        super(model, model.issues.length, text)
        this.reason = new Refs()
        this.actions = new ActionsSet()
        this.certainty = Certainty.unknown
        this.bothersome = bothersome
    }
    
    isIndirectlyCausedBy(cause: Issue) : boolean {
        var todo: Issue[] = [this]
        var seen: number[] = []
        while (todo.length > 0) {
            var issue = todo.pop()
            if (seen.indexOf(issue.id) >= 0) {
                continue
            }
            seen.push(issue.id)
            issue = issue.reason.yes
            if (issue == null) {
                continue
            }
            if (issue.id == cause.id) {
                return true
            }
            todo.push(issue)
        }
        return false
    }
    
    isPotentiallyCausedBy(cause: Issue) : boolean {
        if (this.id == cause.id) {
            return false
        }
        if (this.reason.contains(cause)) {
            return false
        }
        if (this.isIndirectlyCausedBy(cause)) {
            return false
        }
        return true
    }
    
    addReason(reasonText: string) : void {
        this.reason.pushYes(
            this.model.addNewIssue(reasonText, Trinary.maybe)
        )
    }

    addVerifyAction(text: string) : void {
        this.actions.verify.pushYes(
            this.model.addNewAction(text)
        )
    }
    
    addEliminateAction(text: string) : void {
        this.actions.eliminate.pushYes(
            this.model.addNewAction(text)
        )
    }

    addAvoidAction(text: string) : void {
        this.actions.avoid.pushYes(
            this.model.addNewAction(text)
        )
    }

    addIgnoreAction(text: string) : void {
        this.actions.ignore.pushYes(
            this.model.addNewAction(text)
        )
    }
    
    relaxConstraints() : void {
        this.reason.relaxConstraints()
        this.actions.relaxConstraints()
    }
    
    isFact() : boolean {
        return this.certainty == Certainty.fact
    }
    
    isAssumption() : boolean {
        return this.certainty == Certainty.assumption
    }
    
    isEmotion() : boolean {
        return this.certainty == Certainty.emotion
    }
    
    isBelief() : boolean {
        return this.certainty == Certainty.belief
    }
}

class Action extends Entity {
    actionable: Trinary
    readonly blockers: Refs<Issue>

    constructor(model: Model, text: string) {
        super(model, model.actions.length, text)
        this.actionable = Trinary.maybe
        this.blockers = new Refs()
    }
    
    isPotentiallyBlockedBy(issue: Issue) {
        if (this.blockers.contains(issue)) {
            return false
        }
        return true
    }
    
    addBlocker(issueText:string) {
        this.blockers.pushYes(
            this.model.addNewIssue(issueText, Trinary.maybe)
        )
    }
    
    relaxConstraints() : void {
        this.blockers.relaxConstraints()
    }
}

interface IssueAction {
    issue: Issue
    actionType: ActionType
    action: Action
}

class ImmediateSolution {
    readonly issue: Issue
    readonly action: Action
    readonly actionType: ActionType    
    
    constructor(issue: Issue, action: Action, actionType: ActionType) {
        this.issue = issue
        this.action = action
        this.actionType = actionType        
    }
    
    depth() : number {
        return 1
    }
}

class RootCauseSolution {
    readonly issue: Issue
    readonly rootCauseSolution: Solution

    constructor(issue: Issue, rootCauseSolution: Solution) {
        this.issue = issue
        this.rootCauseSolution = rootCauseSolution
    }
    
    depth() : number {
        return this.rootCauseSolution.depth() + 1
    }
}

class UnblockSolution {
    readonly issue: Issue
    readonly actionType: ActionType
    readonly action: Action
    readonly unblockSolution: Solution

    constructor(issue: Issue, action: Action, actionType: ActionType, unblockSolution: Solution) {
        this.issue = issue
        this.actionType = actionType
        this.action = this.issue.actions.get(actionType).yes
        this.unblockSolution = unblockSolution
    }
    
    depth() : number {
        return this.unblockSolution.depth() + 1
    }
}

type Solution = ImmediateSolution | RootCauseSolution | UnblockSolution

class Model {
    issues: Issue[]
    actions: Action[]
    noMoreIssues: boolean

    constructor() {
        this.reset()
    }

    reset() {
        this.issues = []
        this.actions = []
        this.noMoreIssues = false
    }

    relaxConstraints() {
        this.noMoreIssues = false
        for (let issue of this.issues) {
            issue.relaxConstraints()
        }
        for (let action of this.actions) {
            action.relaxConstraints()
        }
    }

    addNewIssue(text: string, bothersome: Trinary) : Issue {
        var issue = new Issue(this, text, bothersome)
        this.issues.push(issue)
        return issue
    }

    addNewAction(text: string) : Action {
        var action = new Action(this, text)
        this.actions.push(action)
        return action
    }

    eachIssue(callback: (x:Issue) => any) {
        for (var ix = 0; ix < this.issues.length; ix++) {
            var ret = callback(this.issues[ix])
            if (ret === false) {
                return false
            }
        }
        return true
    }
}
