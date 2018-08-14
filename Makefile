.PHONY: all
all: docs/socrates.web.js docs/jquery.min.js

clean:
	rm -f docs/socrates.web.js
	rm -f docs/jquery.min.js
	rm -f temp

CORE_SRCS =	src/core/model.ts    \
           	src/core/platform.ts \
           	src/core/view.ts     \
           	src/core/talker.ts   \
	 	   	src/core/thinker.ts  \
			src/core/utils.ts

WEB_SRCS = 	$(CORE_SRCS) \
			src/web/web.ts \
			temp/types/jquery/index.d.ts

docs/socrates.web.js: $(WEB_SRCS)
	tsc --noImplicitAny --sourceMap --outFile $@ $^

temp/types/jquery/index.d.ts:
	@mkdir -p temp/types/jquery
	curl -s -X GET -o $@ https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/jquery/index.d.ts

JQUERY_VER=3.3.1
docs/jquery.min.js:
	curl -s -X GET -o $@ https://code.jquery.com/jquery-$(JQUERY_VER).min.js	

