// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import https = require('https');
import Axios, { AxiosResponse } from 'axios';
import { AzureGitApp } from './AzureGitApp';
import { AzureGitOptions } from './AzureGitOptions';

const SETUPMESSAGE = `$(gift) Setup Azure Git`;
const DOWNLOADMESSAGE = `$(gift) Download Repo`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	var myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'extension.azuregit.downloadRepo';
	
	var options = context.globalState.get('options') as AzureGitOptions;
	if (options)
		myStatusBarItem.text = DOWNLOADMESSAGE;
	else
		myStatusBarItem.text = SETUPMESSAGE;

	myStatusBarItem.show();


	let app = new AzureGitApp(myStatusBarItem);

	let disposable = vscode.commands.registerCommand('extension.azuregit.downloadRepo', (args) => {
		FindFiles(args,context,app);
	});

	let disposable2 = vscode.commands.registerCommand('extension.azuregit.initialize', (args) => {
		Initialize(args,context,app);
	});

	let disposable3 = vscode.commands.registerCommand('extension.azuregit.logout', (args) => {
		context.globalState.update('options',null);
		app.statusBar.text = SETUPMESSAGE;
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(myStatusBarItem);
}



async function Initialize(args:any,context:vscode.ExtensionContext,app:AzureGitApp){
	var org = await vscode.window.showInputBox({
		placeHolder:'Enter ORG',
		prompt: "Enter your Organization Name - https://dev.azure.com/[ORG]"
	});
	if (!org)
		return;
	var pat = await vscode.window.showInputBox({
		placeHolder:'Enter PAT',
		prompt: "Enter Azure DevOps Personal Access Token with access to Code"
	});
	if (!pat)
		return;
	if (org!=undefined && pat!=undefined && org!='' && pat!='')
	{
		let options = new AzureGitOptions();
		options.ORG = org as string;
		options.PAT = pat as string;
		context.globalState.update('options',options);
		app.statusBar.text = DOWNLOADMESSAGE;
	}
}

function convertCSharpDateTime(initialDate: any): Date {
    let dateString = <string>initialDate;
    dateString = dateString.substring(0, dateString.indexOf('T'));
    let timeString = initialDate.substr(initialDate.indexOf("T")+1);
    let dateComponents = dateString.split('-');
    let timeComponents = timeString.split(':');
    let myDate = null;
      
    myDate = new Date(parseInt(dateComponents[0]), parseInt(dateComponents[1]) - 1, parseInt(dateComponents[2]),
      parseInt(timeComponents[0]),parseInt(timeComponents[1]),parseInt(timeComponents[2]));
    
    
    return myDate;
  }

async function FindFiles(args:any,context:vscode.ExtensionContext,app:AzureGitApp){

	app.refreshSettings();
	
	var options = context.globalState.get('options') as AzureGitOptions;
	if (options)
	{
		console.log(options);

		let pat_converted = new Buffer(':' + options.PAT, 'binary').toString('base64');

		let projects:AxiosResponse;
		try
		{
			projects = await Axios.get('https://dev.azure.com/' + options.ORG + '/_apis/projects',{
				headers:{"Authorization":"Basic " + pat_converted}
			});
		}
		catch(error)
		{
			vscode.window.showWarningMessage('Error Connecting -> Try command Azure Git Repos -> Initialize');
			return;
		}

		if (projects.status!=200)
		{
			vscode.window.showWarningMessage('Error Connecting -> Try command Azure Git Repos -> Initialize');
			return;
		}
		

		let allProjects:any[] = [];
		
		projects.data.value.forEach((item:any) => {
			allProjects.push(
				{
					label: item.name,
					description: item.url	
				}
			);
		});
		allProjects.sort(function (a, b) {
			return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
		});
	
		var selectedProject = await vscode.window.showQuickPick(allProjects);
		if (selectedProject)
		{
			projects.data.value.forEach((item:any) => {
				if(item.name==selectedProject.label)
					selectedProject = item.id;
			});
		}
		else
			return;
	
		let data = await Axios.get('https://dev.azure.com/' + options.ORG + '/' + selectedProject + '/_apis/git/repositories?api-version=5.0',{
			headers:{"Authorization":"Basic " + pat_converted}
		});
		console.log(data);
		let repos:any[] = [];
		for(let i = 0;i<data.data.value.length;i++){
			let item = data.data.value[i];
			if (app.sortByLastCommit)
			{
				let commit_data = await Axios.get('https://dev.azure.com/' + options.ORG + '/' + selectedProject + '/_apis/git/repositories/' + item.id + '/commits?searchCriteria.$top=1&api-version=5.0',{
					headers:{"Authorization":"Basic " + pat_converted}
				});
				let date = (commit_data as any).data.value[0].author.date;
				let dateObj = convertCSharpDateTime(date);
				repos.push(
					{
						label: item.name,
						url: item.remoteUrl,
						description: dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString(),
						date: dateObj
					}
				);
			}
			else
			{
				repos.push(
					{
						label: item.name,
						url: item.remoteUrl,
						description: item.remoteUrl
					}
				);
			}

		}
		
		if (app.sortByLastCommit)
		{
			repos.sort(function (a, b) {
				return b.date.getTime() - a.date.getTime()
			});
		}
		else
		{
			repos.sort(function (a, b) {
				return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
			});
		}

	
		var selected = await vscode.window.showQuickPick(repos);
		
		if (selected)
		{
			var terminal:vscode.Terminal;
			if (!app.resuseExistingTerminal)
			{
				terminal = vscode.window.createTerminal();
			}
			else
			{
				terminal = vscode.window.activeTerminal as vscode.Terminal;
				if (terminal == null)
				{
					vscode.window.showErrorMessage("Azure Git Repos: No Active Terminal - Please open a terminal to the directory you want before selecting a repo.");
					return;
				}
			}

			terminal.show();
			
			//backwards compatibility with older versions
			let oldVersion = isOldVersion(app);
			if (oldVersion){
				terminal.sendText(app.command1);
				terminal.sendText(app.command2 + ' ' + selected.url);
				terminal.sendText(app.command3);
			}
			else
			{
				terminal.sendText(replaceGitUrl(app.command1,selected.url));
				terminal.sendText(replaceGitUrl(app.command2,selected.url));
				terminal.sendText(replaceGitUrl(app.command3,selected.url));
			}


		}
	}
	else
	{
		commands.executeCommand('extension.azuregit.initialize');
	}
}

/**
 * Check if this is an older version which doesn't use {{URL}}
 * in that case fall back to using the old commands for
 * backwards compatibility
 */
function isOldVersion(app:AzureGitApp):boolean{
	let isOld = true;
	if (app.command1.indexOf('{{URL}}')>-1) isOld = false;
	if (app.command2.indexOf('{{URL}}')>-1) isOld = false;
	if (app.command3.indexOf('{{URL}}')>-1) isOld = false;
	return isOld;
}

/**
 * Replaces the {{URL}} in the command with the git url
 */
function replaceGitUrl(command:string,url:string):string{
	let newString = command;
	if (newString.indexOf('{{URL}}')>-1){
		newString = newString.replace('{{URL}}',url);
	}
	return newString;
}

// this method is called when your extension is deactivated
export function deactivate() {}
