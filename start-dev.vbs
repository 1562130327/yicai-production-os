Set WshShell = CreateObject("WScript.Shell")

' Start backend
WshShell.Run "cmd /k ""set PATH=D:\npm-global;%PATH% && cd /d D:\溢彩 && pnpm dev""", 1, False

' Wait 3 seconds
WScript.Sleep 3000

' Start frontend
WshShell.Run "cmd /k ""set PATH=D:\npm-global;%PATH% && cd /d D:\溢彩\client && pnpm dev""", 1, False

' Open browser after 2 seconds
WScript.Sleep 2000
WshShell.Run "http://localhost:5173"
