import { ReactNode } from "react";
import { MdClear } from "react-icons/md";
import { open } from "@tauri-apps/api/dialog";

function Settings(props: any) {
	const openFolder = async (setting: any) => {
		const selected = await open({
			multiple: true,
			directory: true,
		});
		if (selected) {
			props.settings[setting].value = selected[0];
			console.log(selected[0]);
		}
	};

	const renderSettings = () => {
		//console.log(props.settings);
		const settings = props.settings;
		let ret: ReactNode[] = [];
		{
			Object.entries(settings).forEach(([key, value]) => {
				ret.push(
					<div>
						<div className="divider"></div>
						<div className="flex flex-row w-full  px-10">
							<div className=" flex-1 flex flex-col items-start">
								<label className="flex-1">{value.name} </label>
								<label className="flex-1 text-gray-400">
									{value.description}
								</label>
							</div>
							<div className="text-end float flex-1 flex flex-col items-end">
								{value.type === "number" ? (
								
										<div className="w-full">
											{/* <input
												type="number"
												value={props.settings[key].value}
												onChange={(e) => {
													props.setSettings({
														...props.settings,
														[key]: {
															...props.settings[key],
															value: parseInt(e.target.value),
														},
													});
												}}
											/> */}
											<div className="tooltip w-2/3" data-tip={value.value + "px"}>
											<input
												className="range range-primary "
												type="range"
												min={value.range[0]}
												max={value.range[1]}
												value={props.settings[key].value}
												onChange={(e) => {
													props.setSettings({
														...props.settings,
														[key]: {
															...props.settings[key],
															value: parseInt(e.target.value),
														},
													});
												}}
											/>
											</div>
										</div>
						
								) : value.type === "path" ? (
									<div className="flex-col flex w-2/3">
										<div className="tooltip pb-2" data-tip={value.value}>
											<div className="text-blue-400 font-bold truncate  ">
												{value.value}
											</div>
										</div>
										<div className="tooltip self-end flex-1" data-tip="Change notes folder ">
										<a
											onClick={() => openFolder(key)}
											className="btn bg-zinc-700 hover:border-blue-400 border-transparent outline-none text-white btn-sm h-[50px] w-[80px] "
										>
											
											Change
										</a>
										</div>
									</div>
								) : value.type === "toggle" ? (
									<div className="form-control flex">
										<span className="label-text flex-1 self-end ">Remember me</span>
										<label className="label cursor-pointer flex-1 self-end">
											<input
												type="checkbox"
												className="toggle"
												onChange={(e) => {
													console.log(e)
												}}
											/>
										</label>
									</div>
								) : null}
							</div>
						</div>
					</div>
				);
			});
		}
		return <div>{ret}</div>;
	};

	return (
		<div className="z-20 top-0 left-0  w-screen h-screen  absolute flex place-content-center">
			<div
				onClick={props.showSettingsModal}
				className="absolute z-40  bg-black opacity-50 w-full h-full"
			></div>
			<div className=" z-50 opacity-100 relative  ml-auto mr-auto mt-auto top-0 bottom-0 mb-auto  left-0 right-0  w-4/5 h-4/5 bg-zinc-800  rounded-xl border-zinc-900 shadow-lg">
				<div className="text-center pt-10 text-xl">Preferences</div>
				<button
					onClick={props.showSettingsModal}
					className="absolute right-0 top-0 text-zinc-400 hover:text-zinc-100 bg-transparent rounded-none border-none focus:outline-none z-20"
				>
					<MdClear />
				</button>
				<br />
				{renderSettings()}
				<div className="divider"></div>
			</div>
		</div>
	);
}

export default Settings;
