import * as vscode from 'vscode';

export class AzureGitApp{
    statusBar:vscode.StatusBarItem
    command1:string = '';
    command2:string = '';
    command3:string = '';
    showStatusBar:boolean = true;
    sortByLastCommit:boolean = false;
    resuseExistingTerminal:boolean = false;

    constructor(statusbar:vscode.StatusBarItem) {  
        this.statusBar = statusbar;
        this.refreshSettings();
        
        vscode.workspace.onDidChangeConfiguration((event)=>{
            //show or hide status bar if config was updated
            if (event.affectsConfiguration('azuregit.settings.showStatusBar'))
            {
                this.refreshSettings();
                if (this.showStatusBar)
                    this.statusBar.show();
                else
                    this.statusBar.hide();

            }
        })
    }

    public refreshSettings(){
        this.command1 = vscode.workspace.getConfiguration('azuregit.settings').get('command1') as string;
        this.command2 = vscode.workspace.getConfiguration('azuregit.settings').get('command2') as string;
        this.command3 = vscode.workspace.getConfiguration('azuregit.settings').get('command3') as string;
        this.showStatusBar = vscode.workspace.getConfiguration('azuregit.settings').get('showStatusBar') as boolean;
        this.sortByLastCommit = vscode.workspace.getConfiguration('azuregit.settings').get('sortByLastCommit') as boolean;
        this.resuseExistingTerminal = vscode.workspace.getConfiguration('azuregit.settings').get('reuseTerminal') as boolean;
    }
    
}