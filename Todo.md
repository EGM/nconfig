# TODO

Stuff I really want to add, soon-ish:

- Mirror the testibility of saveConfig in createConfig by adding a slot for the file reader
- More custom errors: a custom base error and derived errors for different parts of the config reader/loader/parser/whatever
- Write an exists contract and wrapper the same as readFile and writeFile, create a filesystem type that includes all three

## *Might Do*

Wild ideas that might never see the light of day:

- Add the ability to create custom aliases for parsers, such as { alias: "csproj", parser: "xml" }
