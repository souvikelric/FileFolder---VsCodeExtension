import { error } from "console";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  //Testing a console log
  // let folder = vscode.workspace.workspaceFolders?.[0].name
  // console.log(folder)
  const statusItem = vscode.window.createStatusBarItem();

  const countAndShow = () => {
    const workFolder = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    if (!workFolder) {
      vscode.window.showErrorMessage("No Workspace Folder open in vscode");
      return;
    }
    // vscode.window.showInformationMessage(workFolder);
    const config = vscode.workspace.getConfiguration("fileandfoldercounter");
    const color = config.color;
    const githubIncluded = config.githubIncluded;
    console.log(githubIncluded);

    const countFileFolders = (dirPath: string) => {
      let fileCount = 0;
      let folderCount = 0;

      const items = fs.readdirSync(dirPath);
      // vscode.window.showInformationMessage(String(items.length));

      items.forEach((item) => {
        console.log(item);
        const fullPath = path.resolve(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (item === ".git" && githubIncluded === false) {
          return;
        } else if (stat.isDirectory()) {
          folderCount++;
          const nestedFolders = countFileFolders(fullPath);
          fileCount += nestedFolders.fileCount;
          folderCount += nestedFolders.folderCount;
        } else if (stat.isFile()) {
          fileCount++;
        }
      });
      return { fileCount, folderCount };
    };
    const { fileCount, folderCount } = countFileFolders(workFolder);
    const outputString = `files : ${fileCount} folders : ${folderCount}`;

    // To show it in the active Terminal
    //vscode.window.activeTerminal?.sendText(`echo ${outputString}`,true);
    // vscode.window.setStatusBarMessage(outputString);

    const defaultSettings = {
      color: "#cf59f9",
      githubIncluded: false,
    };

    // console.log(workFolder);

    statusItem.backgroundColor = new vscode.ThemeColor("#fff");
    statusItem.color = color;
    statusItem.text = `❄️ ${outputString}`;
    statusItem.show();

    // const config = vscode.workspace.getConfiguration();
    // console.log(config);
  };

  countAndShow();

  vscode.workspace.onDidCreateFiles(() => {
    countAndShow();
  });

  vscode.workspace.onDidDeleteFiles(() => {
    countAndShow();
  });

  // checking if user changedConfiguration
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("fileandfoldercounter")) {
      vscode.window.showInformationMessage(
        "File&Folder Counter Config changed. Recalculating..."
      );
      countAndShow();
    }
  });

  const disposable = vscode.commands.registerCommand(
    "fileandfoldercounter.fileFolderCount",
    () => {
      // Testing some functions and properties
      // let currWorkspace = vscode.workspace.name as string
      // vscode.window.showInformationMessage(currWorkspace);
      // vscode.window.showErrorMessage("This is a test Error");

      countAndShow();
    }
  );

  // vscode.workspace.onDidChangeWorkspaceFolders(()=>{
  // 	countAndShow()
  // })

  context.subscriptions.push(disposable);
}

export function deactivate() {}
