NODE = node
NPM = npm
JSDOC = jsdoc
name = all
 
generate_docs:
	hugo -d ../../public -s docs/reference/
	$(JSDOC) -c conf.json -t docs/jsdoc-template/ -d ./public/api

checkout:
	git clone https://github.com/christkv/vitesse.git public
	git --exec-path public checkout gh-pages	

deploy: checkout generate_docs
	git add public
	git commit -a -m "Updated documentation"
	git --exec-path public push
	rm -rf public
