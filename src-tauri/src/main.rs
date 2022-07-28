#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

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

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![deleteDir, deleteFile])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
