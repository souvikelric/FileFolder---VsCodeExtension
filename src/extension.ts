import { error } from "console";
import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	//Testing a console log
	// let folder = vscode.workspace.workspaceFolders?.[0].name
	// console.log(folder)
	const statusItem = vscode.window.createStatusBarItem();

	const countAndShow = () => {

		const workFolder = vscode.workspace.workspaceFolders ? 
						   vscode.workspace.workspaceFolders[0].uri.fsPath:"";
		if(!workFolder){
			vscode.window.showErrorMessage("Now Workspace Folder open in vscode");
			return;
		}
		// vscode.window.showInformationMessage(workFolder);

		const countFileFolders = (dirPath:string) => {

			let fileCount = 0;
			let folderCount = 0;

			const items = fs.readdirSync(dirPath);
			// vscode.window.showInformationMessage(String(items.length));

			items.forEach(item => {
				const fullPath = path.resolve(dirPath,item);
				const stat = fs.statSync(fullPath);
				if(stat.isDirectory()){
					folderCount++;
					const nestedFolders = countFileFolders(fullPath);
					fileCount += nestedFolders.fileCount;
					folderCount += nestedFolders.folderCount;
				}else if(stat.isFile()){
					fileCount++;
				}
			});
			return {fileCount, folderCount}

		}
		const {fileCount, folderCount} = countFileFolders(workFolder);
		const outputString = `files : ${fileCount}, folders : ${folderCount}`

		// To show it in the active Terminal
		//vscode.window.activeTerminal?.sendText(`echo ${outputString}`,true);
		// vscode.window.setStatusBarMessage(outputString);

		statusItem.backgroundColor = new vscode.ThemeColor("#fff");
		statusItem.color = "#cf59f9";
		statusItem.text=`❄️${outputString}`
		statusItem.show();

		const config = vscode.workspace.getConfiguration();
		// console.log(config);

		}

	countAndShow()

	vscode.workspace.onDidCreateFiles(()=>{
		countAndShow();
	})

	vscode.workspace.onDidDeleteFiles(()=> {
		countAndShow();
	})
	
	const disposable = vscode.commands.registerCommand('fileandfoldercounter.fileFolderCount', () => {
		// Testing some functions and properties
		// let currWorkspace = vscode.workspace.name as string
		// vscode.window.showInformationMessage(currWorkspace);	
		// vscode.window.showErrorMessage("This is a test Error");

		countAndShow();
		
	});

	// vscode.workspace.onDidChangeWorkspaceFolders(()=>{
	// 	countAndShow()
	// })


	context.subscriptions.push(disposable);
}


export function deactivate() {}
