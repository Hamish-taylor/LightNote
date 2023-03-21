
interface Command {
    name : string; 
    description: string;
    
    errorCheck(args : string[]) : string;

    execute(args : string[]) : Promise<boolean>;
    
    display(args : string[]) : any[]
}

export default Command
