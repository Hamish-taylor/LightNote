import react from 'react'
function CommandMenu(props: any) {


    if (props.list.length > 0) {
        return (
            <div className="flex flex-col h-full justify-center hover-border-none transition-colors max-h-[50vh] hover:border-zinc-600 bg-slate-800  border-zinc-700">
                <div className="flex w-full flex-row" >
                    <div className="ml-5 w-[50%] block text-left text-zinc-400">
                            <div> { props.description} </div>
                    </div>
                    <div className="mr-5 w-[50%] block text-right text-zinc-400">
                        {props.list.length} results
                    </div>
                </div>
                <div className="flex flex-col h-full w-full overflow-auto duration-700">
                    {
                        props.list.map((entry: any, index: number) => {
                            return (
                                <div className="text-start" id={entry.name}>
                                    <div
                                        className={entry.name == props.selection ? " h-fit hover:text-zinc-200 bg-zinc-800 border-none focus:border-none focus:outline-none  rounded-none w-full text-start" : "bg-transparent h-fit hover:text-zinc-200 hover:bg-zinc-900 border-none focus:border-none focus:outline-none  rounded-none w-full text-start"}
                                    >
                                        {entry.name}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        )
    } else return null
};
export default CommandMenu;
