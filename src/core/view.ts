class App {
    readonly platform: Platform
    readonly view: View
    readonly model: Model
    readonly talker: Talker
    readonly thinker: Thinker
    
    constructor(platform: Platform) {
        this.platform = platform
        this.view = new View(this)
        this.model = new Model()
        this.talker = new Talker(this)
        this.thinker = new Thinker(this)
    }
    
    think() : void {
        var idea = this.thinker.think()
        idea(this.talker)
    }
    
    start() : void {
        this.talker.start()
    }
}

class View {
    private readonly platform: Platform
    private readonly app: App
    private silenceFlag: boolean

    constructor(app: App) {
        this.app = app
        this.platform = app.platform
        this.silenceFlag = false
    }
    
    say(text: string) : void {
        this.platform.say(text)
        this.silenceFlag = false
    }
    
    sayBullets(prefix: string, bullets: string[], suffix: string) : void {
        this.platform.sayBullets(prefix, bullets, suffix)
        this.silenceFlag = false
    }
    
    askOption(text: string, callback: () => void) : void {
        this.platform.askOption(text, () => {
            this.platform.hear(text)
            this.silenceFlag = true
            if (callback) {
                callback()                
            }
            if (this.silenceFlag) {
                this.app.think()
            }
        })
    }
    
    askInput(prefix: string, callback: (x:string) => void) : void {
        this.platform.askInput(prefix, (text) => {
            this.platform.hear(prefix + " " + text)
            this.silenceFlag = true
            callback(text)
            if (this.silenceFlag) {
                this.app.think()
            }
        })
    }
    
    askNothing() : void {
        this.platform.askNothing()
    }
}

class Controller {
    protected readonly app: App
    protected readonly view: View
    protected readonly model: Model
    
    constructor(app: App) {
        this.app = app
        this.view = app.view
        this.model = app.model
    }
    
    say(text: string | string[]) : void {
        if (Array.isArray(text)) {
            this.view.say(text.join(" "))
        } else {
            this.view.say(text)
        }
    }

    sayBullets(prefix: string, bullets: string[], suffix: string) : void {
        this.view.sayBullets(prefix, bullets, suffix)
    }

    askYesNoMaybeAndPush<T extends Indexed>(refs: Refs<T>, entry: T) {
        this.askYesNoMaybe(
            () => refs.pushYes(entry),
            () => refs.pushNo(entry),
            () => refs.pushMaybe(entry)
        )
    }

    askYesNoMaybe(yes: () => void, no: () => void, maybe: () => void) {
        this.askYesNo(yes, no)
        this.askOption('Maybe', maybe)
    }

    askYesNo(yes: () => void, no: () => void) {
        this.askOption('Yes', yes)
        this.askOption('No', no)
    }
    
    askOption(text: string, callback: (() => void) = null) : void {
        this.view.askOption(text, callback)
    }

    askInput(prefix: string, callback: (x:string) => void) : void {
        this.view.askInput(prefix, callback)
    }
    
    askNothing() : void {
        this.view.askNothing()
    }
}