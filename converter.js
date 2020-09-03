const http = require('http');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();
const dateFormat = require('dateformat');


module.exports.Converter = 
class Converter {
  constructor(updateInterval) {
    if (typeof updateInterval == 'undefined') {
        updateInterval = 3600 * 1000; // Hourly by default
    }
    this.update();
    setInterval(this.update.bind(this), updateInterval);
  }
  
  update() {
    let self = this;
    let dataString = '';
    return new Promise((resolve, reject) => {
      const date = new Date();
      const url = 'http://www.cbr.ru/scripts/XML_daily.asp?date_req=' +
        dateFormat(date,'dd/mm/yyyy');
      http.get(url, function(res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          res.on('data', function(data_) { dataString += data_.toString(); });
          res.on('end', function() {
            parser.parseString(dataString, function(err, result) {
              if (err) {
                reject(err);
                return;
              }
              self.data = self._convertToDict(result);
              resolve();
            });
          });
        }
      })
    });
  }

  convert(amount, currency) {
    let rate = this.data[currency];
    return amount * rate;
  }

  _convertToDict(xmlData) {
    let result = {}
    const valutes = xmlData.ValCurs.Valute;
    for (let i = 0; i < valutes.length; i++) {
      const element = valutes[i];
      const nominal = parseInt(element.Nominal[0])
      const value = parseFloat(element.Value[0].replace(',','.'))
      const charcode = element.CharCode[0] 
      result[charcode] = value/nominal;
    }
    return result;
  }
    
}
