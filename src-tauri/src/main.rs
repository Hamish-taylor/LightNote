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
#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
  // Close splashscreen
  if let Some(splashscreen) = window.get_window("splashscreen") {
    splashscreen.close().unwrap();
  }
  // Show main window
  window.get_window("main").unwrap().show().unwrap();
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
      close_splashscreen
    ])
    .setup(|app| {
      let splashscreen_window = app.get_window("splashscreen").unwrap();
      let main_window = app.get_window("main").unwrap();
      
      // we perform the initialization code on a new task so the app doesn't freeze
      tauri::async_runtime::spawn(async move {
        // initialize your app here instead of sleeping :)
        println!("Initializing...");
        // std::thread::sleep(std::time::Duration::from_secs(2));
        //check settings
        let settings = json::parse(loadSettings().as_str()).unwrap();
        if(settings["mainFolder"]["value"].as_str().unwrap() == "") {
          splashscreen_window.show().unwrap();
        }else {
           splashscreen_window.close().unwrap();
          main_window.show().unwrap();
        }

        //check if the settings are valid
        


       
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
