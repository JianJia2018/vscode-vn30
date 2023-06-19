const vscode = require("vscode")
const http = require("https")

// 获取配置值
const dateFormat = vscode.workspace.getConfiguration("VN30").get("dateFormat")
console.log("dateFormat: ", dateFormat)

// 获取url配置值
const url = vscode.workspace.getConfiguration("VN30").get("openUrl") || "https://cn.investing.com/indices/vn-30-technical?period=month" // 英为财经

const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
/**
 * @param {vscode.ExtensionContext} context
 */
getValue(false)
function activate(context) {
  let disposable = vscode.commands.registerCommand("vn30.VN30", getValue)
  const disposable2 = vscode.commands.registerCommand("extension.openWebPage", openWebPage)
  context.subscriptions.push(disposable)
  context.subscriptions.push(disposable2)

  // 调用函数显示状态栏消息
  setInterval(() => {
    getValue(false)
  }, 10000)
}

function openWebPage() {
  const panel = vscode.window.createWebviewPanel(
    "VN30", // 标识符，用于区分不同的面板
    "VN30", // 面板标题
    vscode.ViewColumn.One, // 面板显示的列位置
    {
      enableScripts: true, // 允许在 Webview 中执行脚本
    }
  )

  panel.webview.html = `<iframe src="${url}" frameborder="0" style="width: 100%; height: 100vh;"></iframe>`
}

function deactivate() {}

function getValue(isMessage = true) {
  http.get(
    "https://api-ddc.wallstcn.com/market/kline?prod_code=VNI30.OTC&tick_count=1&period_type=86400&fields=tick_at%2Copen_px%2Cclose_px%2Chigh_px%2Clow_px%2Cturnover_volume%2Cturnover_value%2Caverage_px%2Cpx_change%2Cpx_change_rate%2Cavg_px%2Cma2",
    resp => {
      let data = ""

      resp.on("data", chunk => {
        data += chunk
      })

      resp.on("end", () => {
        let lines = JSON.parse(data).data.candle["VNI30.OTC"].lines[0]
        let num = lines[1]
        let value = lines[6].toFixed(2)

        let time = new Date().getHours() + ":" + new Date().getMinutes()
        console.log("time: ", resp.headers.date)

        if (time === dateFormat) {
          vscode.window.showInformationMessage(`VN30 (${value}%)  指数: ${num}`, {})
        }
        if (isMessage) {
          let date = new Date(resp.headers.date)
          // toJSON() 返回的是 UTC 时间，所以需要提前修正
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
          console.log("date: ", date)
          let time2 = date.toJSON().substring(0, 19).replace("T", " ")
          vscode.window.showInformationMessage(`时间: ${time2} ---  VN30 (${value}%) --- 指数: ${num}  `)
        }

        const message = `VN30 (${value}%)  指数: ${num}`
        // 创建状态栏项
        statusBarItem.text = message
        statusBarItem.command = "extension.openWebPage"
        statusBarItem.tooltip = message
        statusBarItem.show()
        vscode.commands.registerCommand("extension.openWebPage", openWebPage)
      })
    }
  )
}

module.exports = {
  activate,
  deactivate,
}
