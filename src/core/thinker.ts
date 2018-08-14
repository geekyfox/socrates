type Idea = (t: Talker) => void

class Thinker {
    private model: Model
    private ideas: Idea[]
    private noIdeasFlag: boolean
    private solutionSeeker: SolutionSeeker
    
    constructor(app: App) {
        this.model = app.model
        this.ideas = []
        this.noIdeasFlag = true
        this.solutionSeeker = new SolutionSeeker()
    }

    think() : Idea {
        this.thinkImpl()
        if (this.ideas.length == 0) {
            return (t) => t.getStuck()
        }
        var ix = Math.floor(Math.random() * this.ideas.length)
        return this.ideas[ix]
    }
    
    private addIdea(idea: Idea) : void {
        this.ideas.push(idea)
        this.noIdeasFlag = false
    }

    private thinkImpl() : void {
        this.ideas = []
        if (this.produceActionPlan()) {
            return
        }
        this.askForAdditionalIssues()
        for (let issue of this.model.issues) {
            this.thinkAboutIssue(issue)
        }
        for (let action of this.model.actions) {
            this.thinkAboutAction(action)
        }
    }

    produceActionPlan() : boolean {
        if (! this.model.noMoreIssues) {
            return false
        }
        let actionPlan : Solution[] = []
        let isComplete = true
        for (let issue of this.model.issues) {
            if (issue.bothersome == Trinary.maybe) {
                isComplete = false
                continue
            }
            if (issue.bothersome == Trinary.no) {
                continue
            }
            let solution = this.solutionSeeker.find(issue)
            if (solution == null) {
                isComplete = false
            } else {
                actionPlan.push(solution)                
            }
        }
        if (isComplete) {
            this.addIdea((t) => t.suggestActionPlan(actionPlan))    
        }
        return isComplete
    }

    askForAdditionalIssues() : void {
        if (this.model.noMoreIssues) {
            return
        }
        if (this.model.issues.length == 0) {
            this.addIdea((t) => t.askForFirstIssue())
        } else {
            this.addIdea((t) => t.askForMoreIssues())            
        }
    }

    thinkAboutIssue(issue: Issue) : void {
        if (issue.bothersome == Trinary.maybe) {
            this.addIdea((t) => t.askIfIssue(issue).isBothersome())
        }
        if (issue.certainty == Certainty.unknown) {
            this.addIdea((t) => t.askIfIssue(issue).isCertain())
            return
        }
        let rules = new IssueRules(issue)
        if (rules.mayHaveReasons()) {
            this.thinkAboutReasonsOfIssue(issue)
        }
        if (rules.mayHaveEliminateActions()) {
            this.suggestEliminateActions(issue)
        }
        if (rules.mayHaveAvoidActions()) {
            this.suggestAvoidActions(issue)
        }
        if (rules.mayHaveIgnoreActions()) {
            this.suggestIgnoreActions(issue)
        }
        if (rules.mayHaveVerifyActions()) {
            this.suggestVerifyActions(issue)
        }
    }
    
    thinkAboutAction(action: Action) : void {
        switch (action.actionable) {
            case Trinary.yes:
                break
            case Trinary.no:
                this.thinkAboutBlockersOfAction(action)
                break
            case Trinary.maybe:
                this.addIdea((t) => t.askIfAction(action).isActionable())
                break
            default:
                assertUnreachable(action.actionable)                
        }
    }

    thinkAboutReasonsOfIssue(issue: Issue) : void {
        if (issue.reason.isComplete()) {
            return
        }
        this.noIdeasFlag = true        
        this.suggestReasonsAmongKnownIssues(issue);
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfIssue(issue).hasKnownReason())
        }
    }
    
    thinkAboutBlockersOfAction(action: Action) : void {
        if (action.blockers.isComplete()) {
            return
        }
        this.noIdeasFlag = true
        this.suggestBlockersAmongKnownIssues(action)
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfAction(action).hasKnownBlockers())
        }
    }
    
    suggestVerifyActions(issue: Issue) : void {
        if (issue.actions.verify.isComplete()) {
            return
        }
        this.noIdeasFlag = true
        for (let action of this.model.actions) {
            if (issue.actions.isValidVerify(action)) {
                this.addIdea((t) => t.askIfIssue(issue).canBeVerifiedVia(action))
            }
        }
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfIssue(issue).canBeVerified())
        }
    }
    
    suggestEliminateActions(issue: Issue) : void {
        if (issue.actions.eliminate.isComplete()) {
            return
        }
        this.noIdeasFlag = true
        for (let action of this.model.actions) {
            if (issue.actions.isValidEliminate(action)) {
                this.addIdea((t) => t.askIfIssue(issue).canBeEliminatedVia(action))
            }
        }
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfIssue(issue).canBeEliminated())
        }
    }

    suggestAvoidActions(issue: Issue) : void {
        if (issue.actions.avoid.isComplete()) {
            return
        }
        this.noIdeasFlag = true
        for (let action of this.model.actions) {
            if (issue.actions.isValidAvoid(action)) {
                this.addIdea((t) => t.askIfIssue(issue).canBeAvoidedVia(action))
            }
        }
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfIssue(issue).canBeAvoided())
        }
    }

    suggestIgnoreActions(issue: Issue) : void {
        if (issue.actions.ignore.isComplete()) {
            return
        }
        this.noIdeasFlag = true
        for (let action of this.model.actions) {
            if (issue.actions.isValidIgnore(action)) {
                this.addIdea((t) => t.askIfIssue(issue).canBeIgnoredVia(action))
            }
        }
        if (this.noIdeasFlag) {
            this.addIdea((t) => t.askIfIssue(issue).canBeIgnored())
        }
    }

    suggestReasonsAmongKnownIssues(issue: Issue) : void {
        for (let otherIssue of this.model.issues) {
            if (issue.isPotentiallyCausedBy(otherIssue)) {
                this.addIdea((t) => t.askIfIssue(issue).isCausedBy(otherIssue))
            }
        }
    }
    
    suggestBlockersAmongKnownIssues(action: Action) : void {
        for (let issue of this.model.issues) {
            if (action.isPotentiallyBlockedBy(issue)) {
                this.addIdea((t) => t.askIfAction(action).isBlockedBy(issue))
            }
        }
    }
}

class IssueRules {
    private readonly issue: Issue

    constructor(issue: Issue) {
        this.issue = issue
    }
    
    mayHaveReasons() : boolean {
        return this.issue.isFact() || this.issue.isEmotion() || this.issue.isBelief()
    }
    
    mayHaveEliminateActions() : boolean {
        return this.issue.isFact() || this.issue.isEmotion()
    }
    
    mayHaveAvoidActions() : boolean {
        return this.issue.isFact() || this.issue.isBelief()
    }
    
    mayHaveIgnoreActions() : boolean {
        return this.issue.isFact() || this.issue.isEmotion()
    }
    
    mayHaveVerifyActions() : boolean {
        return this.issue.isAssumption()
    }
    
    getApplicableActionTypes() : ActionType[] {
        let types = []
        if (this.mayHaveEliminateActions()) {
            types.push(ActionType.eliminate)
        }
        if (this.mayHaveAvoidActions()) {
            types.push(ActionType.avoid)
        }
        if (this.mayHaveIgnoreActions()) {
            types.push(ActionType.ignore)
        }
        if (this.mayHaveVerifyActions()) {
            types.push(ActionType.verify)
        }
        return types
    }
    
    // getApplicableActions() : IssueAction[] {
    //     let options = []
    //     if (this.mayHaveEliminateActions()) {
    //         options.push({
    //             issue: this.issue,
    //             action: this.issue.actions.eliminate.yes,
    //             actionType: ActionType.eliminate
    //         })
    //     }
    //     if (this.mayHaveAvoidActions()) {
    //         options.push({
    //             issue: this.issue,
    //             action: this.issue.actions.avoid.yes,
    //             actionType: ActionType.avoid
    //         })
    //     }
    //     if (this.mayHaveIgnoreActions()) {
    //         options.push({
    //             issue: this.issue,
    //             action: this.issue.actions.ignore.yes,
    //             actionType: ActionType.ignore
    //         })
    //     }
    //     if (this.mayHaveVerifyActions()) {
    //         options.push({
    //             issue: this.issue,
    //             action: this.issue.actions.verify.yes,
    //             actionType: ActionType.verify
    //         })
    //     }
    //     options = options.filter((x) => x.action != null)
    //     return options
    // }
}

class SolutionSeeker {
    find(issue: Issue) : Solution {
        return this.findImpl(issue, [])
    }
    
    private findImpl(issue: Issue, stack: number[]) : Solution {
        if (stack.indexOf(issue.id) >= 0) {
            return null
        }
        let immediate = this.findImmediate(issue)
        if (immediate != null) {
            return immediate
        }
        let rootCause = this.findRootCause(issue, stack)
        let unblock = this.findUnblock(issue, stack)
        return this.chooseOptimal([rootCause, unblock])
    }
    
    private findImmediate(issue: Issue) : ImmediateSolution {
        let applicable = new IssueRules(issue).getApplicableActionTypes()
        let options = []
        for (let actionType of applicable) {
            let action = issue.actions.get(actionType).yes
            if ((action == null) || (action.actionable != Trinary.yes)) {
                continue
            }
            options.push(new ImmediateSolution(issue, action, actionType))
        }
        return this.chooseOptimal(options)
    }
    
    private findRootCause(issue: Issue, stack: number[]) : RootCauseSolution {
        if (issue.reason.yes == null) {
            return null
        }
        let s = this.findImpl(issue.reason.yes, stack.concat([issue.id]))
        if (s == null) {
            return null
        }
        return new RootCauseSolution(issue, s)
    }
    
    private findUnblock(issue: Issue, stack: number[]) : UnblockSolution {
        let applicable = new IssueRules(issue).getApplicableActionTypes()
        let options = []
        for (let actionType of applicable) {
            let action = issue.actions.get(actionType).yes
            if (action == null) {
                continue
            }
            if (action.blockers.yes == null) {
                continue
            }
            let s = this.findImpl(action.blockers.yes, stack.concat([issue.id]))
            if (s != null) {
                options.push(new UnblockSolution(issue, action, actionType, s))
            }
        }
        return this.chooseOptimal(options)
    }
    
    private chooseOptimal<T extends Solution>(options: T[]) : T {
        let nonNull = options.filter((x) => x != null)
        if (nonNull.length == 0) {
            return null
        }
        if (nonNull.length == 1) {
            return nonNull[0]
        }
        let optimal = []
        for (let x of nonNull) {
            if (optimal.length > 0) {
                let delta = x.depth() - optimal[0].depth()
                if (delta > 0) {
                    continue
                }
                if (delta < 0) {
                    optimal = []
                }
            }
            optimal.push(x)
        }
        let ix = Math.floor(Math.random() * optimal.length)
        return optimal[ix]
    }
}
