interface Platform {
    say(text: string) : void
    hear(text: string) : void
    sayBullets(prefix: string, bullets: string[], suffix: string) : void
    askInput(prefix: string, callback: (x:string) => void) : void
    askOption(text: string, callback: () => void) : void
    askNothing() : void
}

