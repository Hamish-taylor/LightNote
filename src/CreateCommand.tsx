import Command from './Command'

class CreateCommand implements Command {
    name: string = "Create";
    description: string = "Create a new note";

    errorCheck(args: string[]): string {
        return "not implemented"
    };

    async execute(args: string[]): Promise<boolean> {
        return false;
    }

    display(args: string[]): string[] {
        return []
    }


}
