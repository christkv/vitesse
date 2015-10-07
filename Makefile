NODE = node
NPM = npm
JSDOC = jsdoc
name = all
 
generate_docs:
	hugo -d ../../public -s docs/reference/
	$(JSDOC) -c conf.json -t docs/jsdoc-template/ -d ./public/api
