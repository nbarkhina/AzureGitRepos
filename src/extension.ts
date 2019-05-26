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

async function FindFiles(args:any,context:vscode.ExtensionContext,app:AzureGitApp){
	
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
		

		let allProjects:string[] = [];
		
		projects.data.value.forEach((item:any) => {
			allProjects.push(item.name);
		});
		allProjects.sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
	
		var selectedProject = await vscode.window.showQuickPick(allProjects);
		if (selectedProject)
		{
			projects.data.value.forEach((item:any) => {
				if(item.name==selectedProject)
					selectedProject = item.id;
			});
		}
	
		let data = await Axios.get('https://dev.azure.com/' + options.ORG + '/' + selectedProject + '/_apis/git/repositories?api-version=5.0',{
			headers:{"Authorization":"Basic " + pat_converted}
		});
		console.log(data);
		let repos:string[] = [];
		data.data.value.forEach((item:any) => {
			repos.push(item.remoteUrl);
		});
		repos.sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
	
		var selected = await vscode.window.showQuickPick(repos);
		
		if (selected)
		{
			app.refreshSettings();
			var terminal = vscode.window.createTerminal();
			terminal.show();
			terminal.sendText(app.command1);
			terminal.sendText(app.command2 + ' ' + selected);
			terminal.sendText(app.command3);
		}
	}
	else
	{
		commands.executeCommand('extension.azuregit.initialize');
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
