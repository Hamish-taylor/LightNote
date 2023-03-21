#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[derive(Debug, Default)]
struct MetaData {
    tags: Vec<String>,
    files: HashMap<String, HashSet<String>>,
}

use std::{
    collections::{HashMap, HashSet},
    fs,
};

use directories::UserDirs;

use std::sync::Mutex;
use tauri::State;

struct MD(Mutex<String>);

#[tauri::command]
fn delete_dir(path: &str) {
    println!("Deleting: {}", path);
    let res = std::fs::remove_dir_all(path);
    if let Err(e) = res {
        println!("Error: {}", e);
    }
}

#[tauri::command]
fn delete_file(path: &str) {
    println!("Deleting: {}", path);
    let res = std::fs::remove_file(path);
    if let Err(e) = res {
        println!("Error: {}", e);
    }
}

#[tauri::command]
fn load_config(path: &str, meta_data: State<MD>) {
    //check if the file exists, if not create it
    match fs::metadata(path) {
        Ok(t) => {
            let config = fs::read_to_string(path).expect("Could not read config");
            let parsed = json::parse(&config).unwrap();
            //loops over tags
            let mut md = meta_data.0.lock().unwrap();
            *md = parsed.to_string();
        }
        Err(err) => {
            println!("Config file does not exist, creating a new one");
            match meta_data.0.lock() {
                Ok(mut res) => {
                    *res = json::parse("{\"tags\": [],\"files\": {}}")
                        .unwrap()
                        .to_string();
                }
                Err(err) => println!("error when trying to create the config file: {}", err),
            }
        }
    }
}

#[tauri::command]
fn get_config(meta_data: State<MD>) -> String {
    meta_data.0.lock().unwrap().to_string()
}

#[tauri::command]
fn add_tag(tag: &str, meta_data: State<MD>) {
    let mut md = meta_data.0.lock().unwrap();
    let mut parsed = json::parse(&md).unwrap();
    //add tag into the json
    if !parsed["tags"].contains(tag) {
        println!("adding tag: {}", tag);
        parsed["tags"].push(tag).expect("could not add tag");
        let st = json::stringify_pretty(parsed, 2);
        *md = st;
    }
}

#[tauri::command]
fn add_tag_to_file(file: &str, tag: &str, meta_data: State<MD>) {
    let mut md = meta_data.0.lock().unwrap();
    let parsed = json::parse(&md);

    match parsed {
        Ok(mut res) => {
            //check if the tag exists, shouldnt be an issue at this is being checked on the frontend but oh
            //well
            println!("Adding tag: {} to file: {}", tag, file);
            if !res["tags"].contains(tag) || res["files"][file]["tags"].contains(tag) {
                return;
            }

            //add it to the file
            println!("{}", res["files"][file]["tags"]);
            res["files"][file]["tags"]
                .push(tag)
                .expect("could not add tag to file");

            let st = json::stringify_pretty(res, 2);
            println!("{}", st);
            *md = st;
        }
        Err(err) => {
            println!("{err} in {}", &md)
        }
    }
}
#[tauri::command]
fn add_file(file: &str, meta_data: State<MD>) {
    let mut md = meta_data.0.lock().unwrap();
    let parsed = json::parse(&md);
    //add tag into the json
    //
    //
    match parsed {
        Ok(mut res) => {
            if !res["files"].contains(file) {
                println!("adding file: {}", file);
                //research how to add an object to a json value, chatgpt probably knows
                let f = json::object! {
                    "tags": []
                };
                res["files"][file] = f;
                let st = json::stringify_pretty(res, 2);
                *md = st;
            }
        }
        Err(err) => {
            println!("{}", err)
        }
    }
}
#[tauri::command]
fn remove_tag_from_file(file: &str, tag: &str, meta_data: State<MD>) {
    let mut md = meta_data.0.lock().unwrap();
    let parsed = json::parse(&md);

    match parsed {
        Ok(mut res) => {
            //check if the tag exists, shouldnt be an issue at this is being checked on the frontend but oh
            //well
            println!("Removing tag: {} from file: {}", tag, file);
            if !res["tags"].contains(tag) || !res["files"][file]["tags"].contains(tag) {
                println!("Aborting removing tag");
                return;
            }

            //add it to the file
            println!("{}", res["files"][file]["tags"]);
            let index = res["files"][file]["tags"].members().position(|t| t == tag).unwrap();
            res["files"][file]["tags"].array_remove(index);
            let st = json::stringify_pretty(res, 2);
            println!("{}", st);
            *md = st;
        }
        Err(err) => {
            println!("{err} in {}", &md)
        }
    }
}

#[tauri::command]
fn remove_file(file: &str, meta_data: State<MD>) {
    let mut md = meta_data.0.lock().unwrap();
    let parsed = json::parse(&md);

    match parsed {
        Ok(mut res) => {
            println!("Removing file: {}", file);

            res["files"][file]["tags"].clear();
            let st = json::stringify_pretty(res, 2);
            println!("{}", st);
            *md = st;
        }
        Err(err) => {
            println!("{err} in {}", &md)
        }
    }
}

#[tauri::command]
fn save_config(path: &str, meta_data: State<MD>) {
    let md = meta_data.0.lock().unwrap();
    let parsed = json::parse(&md);
    //add tag into the json
    match parsed {
        Ok(res) => {
            let st = json::stringify_pretty(res, 2);
            let stt = st.as_str();
            if (stt != "null") {
                match fs::write(path, stt) {
                    Ok(_) => {
                        println!("SAVED: {}", stt);
                    }
                    Err(err) => {
                        println!("{err} in path {}", path)
                    }
                }
            }
        }
        Err(err) => {
            println!("{err} in {}", &md)
        }
    }
}

fn main() {
    tauri::Builder::default()
        .manage(MD(Default::default()))
        .invoke_handler(tauri::generate_handler![
            delete_dir,
            delete_file,
            load_config,
            get_config,
            add_tag_to_file,
            add_tag,
            save_config,
            remove_tag_from_file,
            add_file,
            remove_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
