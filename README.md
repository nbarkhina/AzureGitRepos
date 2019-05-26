# Azure Git Repos Extension

This is a simple to use VS Code extension to easily download your Git Repos by navigating your Projects from the Command Bar. One of the most frustrating parts of downloading your Git code is remembering those pesky remote URLS. This extension makes it so you never have to memorize a URL again! Only supports Git projects hosted in Azure Repos.

## Features

To setup the extension start by adding your Organization name and Personal Access Token generated from Azure DevOps. The token only needs access to read Code. After that you can browse your project names and repos from inside VS Code.

![Azure Repos Tutorial](images/animated_tutorial.gif)

> Tip: You can also access all of the commands from the Command Bar starting with the name 'Azure Git Repos'

* Initialize - Set Org and Personal Access Token
* Download Repo - Displays projects picker to download from repo
* Logout - Clears the Org and PAT

![Azure Repos Command Bar](images/command_bar.png)

Generate your Personal Access Token from your Azure DevOps site

![Azure Repos PAT](images/pat.jpg)


## Extension Settings

You can customize the extension from the User Settings in VSCode

![Azure Repos Settings](images/animated_settings.gif)

Allows you to customize what terminal commands run when downloading from a repo

* `azuregit.settings.command1` 
* `azuregit.settings.command2` 
* `azuregit.settings.command3` 

Set whether you want the Download Repo button to appear at the bottom of VS Code

* `azuregit.settings.showStatusBar`

![Azure Repos Button](images/status_bar.jpg)

## Requirements

> Requires running VS Code version 1.28.0 or later
