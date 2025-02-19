import { error } from "console";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  //Testing a console log
  // let folder = vscode.workspace.workspaceFolders?.[0].name
  // console.log(folder)

  // function to check if color value provided is a valid hex code or not
  function checkHex(hexcode: string) {
    let len = hexcode.length;
    if (len != 7) return false;
    if (hexcode[0] !== "#") return false;
    let allChars = hexcode.split("");
    allChars.shift();
    const validChars = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ];
    return allChars.every(
      (ac: any) => validChars.find((vc) => vc === ac) !== undefined
    );
  }

  let lastFilePath: string;
  let lastFolderPath: string;

  const statusItem = vscode.window.createStatusBarItem();

  const countAndShow = () => {
    statusItem.text = `$(sync~spin) Calculating...`;
    const workFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    if (!workFolder) {
      vscode.window.showErrorMessage("No Workspace Folder open in vscode");
      return;
    }
    // vscode.window.showInformationMessage(workFolder);
    const config = vscode.workspace.getConfiguration("fileandfoldercounter");
    const { color, githubIncluded, showSizeOnDisk, nodeModulesIncluded } =
      config;
    let totalMemory = 0;

    const countFileFolders = (dirPath: string) => {
      let fileCount = 0;
      let folderCount = 0;

      const items = fs.readdirSync(dirPath);
      // vscode.window.showInformationMessage(String(items.length));

      items.forEach((item) => {
        // if (item === "picture1.jpg") {
        //   console.log(item);
        //   console.log(fs.statSync(path.resolve(dirPath, item)).size);
        // }
        const fullPath = path.resolve(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (item === ".git" && githubIncluded === false) {
          return;
        }
        if (item === "node_modules" && nodeModulesIncluded === false) {
          console.log(item);
          return;
        } else if (stat.isDirectory()) {
          folderCount++;
          const nestedFolders = countFileFolders(fullPath);
          fileCount += nestedFolders.fileCount;
          folderCount += nestedFolders.folderCount;
        } else if (stat.isFile()) {
          fileCount++;
          //for debugging
          // console.log(stat.size / 1024 / 1024, item, "memory : ", totalMemory);
          totalMemory += stat.size;
        }
      });
      return { fileCount, folderCount, totalMemory };
    };
    let strMem = "";
    let {
      fileCount,
      folderCount,
      totalMemory: memory,
    } = countFileFolders(workFolder);
    if (showSizeOnDisk) {
      if (memory > 1024) {
        memory = memory / 1024;
        strMem = memory.toFixed(2) + " KB";
      }
      if (memory > 1024) {
        memory = memory / 1024;
        strMem = memory.toFixed(2) + " MB";
      }
      strMem = ` Size : ${strMem}`;
    }
    const outputString = `files : ${fileCount} folders : ${folderCount}${strMem}`;

    // To show it in the active Terminal
    //vscode.window.activeTerminal?.sendText(`echo ${outputString}`,true);
    // vscode.window.setStatusBarMessage(outputString);

    const defaultSettings = {
      color: "#cf59f9",
      githubIncluded: false,
    };

    // console.log(workFolder);

    // statusItem.backgroundColor = new vscode.ThemeColor("#fff");
    // check if color setting is valid or not
    // if not change it back to default color
    if (checkHex(color)) {
      statusItem.color = color;
    } else {
      config
        .update(
          "color",
          defaultSettings.color,
          vscode.ConfigurationTarget.Global
        )
        .then(
          () => {
            vscode.window.showErrorMessage(
              "Invalid value entered. Setting color value to default value."
            );
          },
          (err) => {
            console.error("Error updating setting:", err);
          }
        );
    }

    statusItem.text = `❄️ ${outputString}`;
    statusItem.show();
  };

  countAndShow();

  vscode.workspace.onDidCreateFiles((event) => {
    // const workFolder = vscode.workspace.workspaceFolders
    //   ? vscode.workspace.workspaceFolders[0].uri.fsPath
    //   : "";
    // let baseFolderPathlength = workFolder.split("/").length;
    let lastCreatedPath = event.files[0].path;
    if (lastCreatedPath.includes(".")) {
      lastFilePath = lastCreatedPath;
    } else {
      lastFolderPath = lastCreatedPath;
    }
    // logging the last deleted file and folder
    console.log(lastFilePath, lastFolderPath);
    countAndShow();
  });

  vscode.workspace.onDidDeleteFiles(() => {
    countAndShow();
  });

  // checking if user changedConfiguration
  vscode.workspace.onDidChangeConfiguration((e) => {
    const changedEvent = e.affectsConfiguration("fileandfoldercounter");
    if (changedEvent) {
      vscode.window.showInformationMessage(
        "File&Folder Counter Config changed. Recalculating..."
      );
      if (e.affectsConfiguration("fileandfoldercounter.nodeModulesIncluded")) {
        let workingFolder = vscode.workspace.workspaceFolders
          ? vscode.workspace.workspaceFolders[0].uri.fsPath
          : "";
        if (!fs.existsSync(path.join(workingFolder, "node_modules"))) {
          vscode.window.showErrorMessage(
            "No Node Modules folder located in current folder"
          );
        }
      }
      countAndShow();
    }
  });

  const disposable = vscode.commands.registerCommand(
    "fileandfoldercounter.fileFolderCount",
    () => {
      countAndShow();
    }
  );

  // vscode.workspace.onDidChangeWorkspaceFolders(()=>{
  // 	countAndShow()
  // })

  context.subscriptions.push(disposable);
}

export function deactivate() {}
