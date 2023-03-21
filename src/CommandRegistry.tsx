import Command from './Command'

class CommandRegistry {
    private commands: Command[] = [];

    public register(command: Command) {
        let c = this.commands.filter((c: Command) => {
            return c.name == command.name;
        })
        if (c.length > 0) console.log("Failed to add command: command already exists")
        else {
            this.commands.push(command);

        }
    }

    public getCommands(): Command[] {
        return this.commands;
    }

    public getCommand(name: string): Command {
        let c = this.commands.filter((c: Command) => {
            return c.name.trim().toLowerCase() == name.trim().toLowerCase();
        })
        console.log(this.commands)
        if (c.length > 1) throw new Error("More than one command has the same name");
        else if (c.length == 0) console.log("command " + name + " does not exist")
        return c[0];
    }
}

export default CommandRegistry;
