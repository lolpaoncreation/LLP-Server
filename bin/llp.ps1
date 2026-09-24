$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node "$scriptDir\llp.js" @args
