PACKAGE_NAME = auto-password-registerer

all: xpi

xpi: buildscript/makexpi.sh
	cp buildscript/makexpi.sh ./
	./makexpi.sh -n $(PACKAGE_NAME) -o
	rm ./makexpi.sh

buildscript/makexpi.sh:
	git submodule update --init
