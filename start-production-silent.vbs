Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "D:\溢彩"
objShell.Run "node dist/index.js", 0, False
