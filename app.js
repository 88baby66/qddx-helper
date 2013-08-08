var http=require('http'),
    request=require('request'),
    cheerio = require('cheerio'),
    wechat = require('node-wechat');

http.createServer(function (req, res) {
  wechat.handler(req, res);
  wechat.text(function (data) {
    var ToUserName = data.ToUserName;
    var FromUserName = data.FromUserName;

    var arr = data.Content.split(" ");
    if (!arr[2]) arr[2] = new Date().getFullYear();
    if (!arr[3]) arr[3] = "";

    request.post({
      url: "http://jw.qdu.edu.cn/academic/j_acegi_security_check",
      form: {j_username: arr[0], j_password: arr[1]},
      jar: true
    }, callback1);

    function callback1 (err, res) {
      if (!err && res.statusCode == 302) {
        request.post({
          url: "http://jw.qdu.edu.cn/academic/manager/score/studentOwnScore.do",
          form: {year: parseInt(arr[2]) - 1980, term: arr[3], para: 0},
          jar: true
        }, callback2);
      }
    }

    function callback2 (err, res, data) {
      if (!err && res.statusCode == 200) {
        var $ = cheerio.load(data);
        var Content = $(".datalist tr").map(function (i) {
          if (i != 0) {
            var $td = $(this).children('td');
            return $td.eq(3).text() + " " + $td.eq(5).text();
          }
        }).join("\n");

        if (Content == "") {
          Content = "编辑发送:\n\n" +
          "学号 密码:\n查询今年全部科目成绩\n\n" +
          "学号 密码 年份:\n查询某年全部科目成绩\n\n" +
          "学号 密码 年份 学期号:\n查询某年某学期的科目成绩(空:全部 1:春 2:秋)"
        }

        var msg = {
          FromUserName : ToUserName,
          ToUserName : FromUserName,
          MsgType : "text",
          Content : Content,
          FuncFlag : 0
        }
        wechat.send(msg);
      }
    }
  });
}).listen(80);