NODE = node
NPM = npm
JSDOC = jsdoc
name = all
 
generate_docs:
	hugo -d ../../public -s docs/reference/
	$(JSDOC) -c conf.json -t docs/jsdoc-template/ -d ./public/api

checkout:
	rm -rf public
	git clone git@github.com:christkv/vitesse.git public
	git --git-dir ./public/.git --work-tree ./public checkout gh-pages
	rm -rf ./public/*

deploy: checkout generate_docs
	git --git-dir ./public/.git --work-tree ./public add .
	git --git-dir ./public/.git --work-tree ./public commit -a -m "Updated documentation"
	git --git-dir ./public/.git --work-tree ./public push origin gh-pages
