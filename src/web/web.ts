class Web implements Platform {
    say(arg:string) : void {
        this.phrase('say', arg)
    }

    hear(arg:string) : void {
        $('#reply-pane').empty()
        this.phrase('hear', arg)
    }

    sayBullets(prefix:string, items:string[], suffix:string) : void {
        var element = $('<div class="phrase"/>').text(prefix)
        var list = $('<ul/>')
        for (var ix = 0; ix < items.length; ix++) {
            var listItem = $('<li/>').text(items[ix])
            list.append(listItem)
        }
        element.append(list)
        if (suffix) {
            element.append($('<span>').text(suffix))
        }
        this.phraseImpl('say', element)
    }

    askOption(text: string, callback: () => void) : void {
        if (!callback) {
            throw callback.toString()
        }
        var elem = $('<button/>').text(text).click(callback)
        $('#reply-pane').append(elem)
    }

    askInput(prefix:string, callback:((x:string) => void)) : void {
        var submit = $('<button>Submit</button>')
            .prop('disabled', true)
            .click(() => {
                var val = input.val().toString().trim()
                callback(val)
            })

        var input =
            $('<input type="text" />')
            .keyup(function(evt) {
                var flag = input.val().toString().trim() ? false : true;
                submit.prop('disabled', flag)
                if ((!flag) && (evt.key === 'Enter')) {
                    submit.click()
                }
            })

        var wrapper = $('<span/>')
        if (prefix) {
            wrapper.append(prefix)
            wrapper.append('&nbsp;')
        }
        wrapper.append(input)
        wrapper.append(submit)
        $('#reply-pane').append(wrapper)
    }

    askNothing() : void {
        $('#reply-pane').hide()
    }

    phrase(cssClass: string, text: string) : void {
        var element = $('<div class="phrase"/>').text(text)
        this.phraseImpl(cssClass, element)
    }

    phraseImpl(cssClass: string, element: JQuery) : void {
        var wrapper = $('<div class="phrase-wrapper clearfix"/>')
            .addClass(cssClass)
            .append(element)
        $('#reply-pane').before(wrapper)
    }
}
