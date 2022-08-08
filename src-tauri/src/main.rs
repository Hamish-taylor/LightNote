#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use directories::UserDirs;
use tauri::Manager;

#[tauri::command]
fn deleteDir(path: &str) {
  println!("Deleting: {}", path);
  let res = std::fs::remove_dir_all(path);
  if let Err(e) = res {
    println!("Error: {}", e);
  }
}

#[tauri::command]
fn deleteFile(path: &str) {
  println!("Deleting: {}", path);
  let res = std::fs::remove_file(path);
  if let Err(e) = res {
    println!("Error: {}", e);
  }
}

fn loadSettings() -> String {
  let mut documents_dir = "";
  if let Some(user_dirs) = UserDirs::new() {
    documents_dir = user_dirs.document_dir().unwrap().to_str().unwrap();

    //read the documents directory
    let settings_path = format!("{}/lightway/LightWay.json", documents_dir);
    let settings = std::fs::read_to_string(settings_path).unwrap();
    return settings;
  }else {
    return "".to_string();
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      deleteDir,
      deleteFile,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
