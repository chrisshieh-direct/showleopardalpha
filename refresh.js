const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs/promises');

const refreshData = async () => {
  try {
    const response = await axios.get('https://as.api.red61.co.uk/as/reports/rest/datalinks/4062?token=MAR14%3A207b93df7febfc5cc080739b595cbfb4a8cf02ae7d8a9ad36233e1f0ebc9b753038f67c0b38da8fa8f4f0631ebd99085&', {
      auth: {
        username: 'q',
        password: 'qqqqqqqq'
      }
    });

    const dom = new JSDOM(response.data);
    const $ = (require('jquery'))(dom.window);

    const data = [];
    $('table tr').each((i, row) => {
      const rowItems = [];
      $(row).find('td').each((j, cell) => {
        rowItems.push($(cell).text());
      });
      if (i === 0) {
        data.push({ headers: rowItems });
      } else {
        data.push(rowItems);
      }
    });

    const rows = data.slice(1); // Remove header row
    let totalSoldCount = 0;

    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleString('en-GB', { timeZone: 'Europe/London' }); // Format time as per your preference
    let htmlContent = `<html>
    <head>
    <link rel="stylesheet" href="/output.css">
    </head>
    <body class="text-2xl"><p>Last refreshed: ${formattedTime}</p><table>`;
    let currentDate = `<h1 class="text-2xl">Today</h1>`;
    let nextThreeDates = `<h3 class="text-2xl">Next three shows</h3>`;

    rows.forEach(row => {
      const date = new Date(row[6]);
      const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const soldCountInclCA = parseInt(row[14]);

      if (formattedDate === 'Aug 2, 2023') {
        currentDate += `<h2>${soldCountInclCA} sold (${87 - soldCountInclCA} remaining)</h2>`;
      };

      if (formattedDate === 'Aug 3, 2023' || formattedDate === 'Aug 4, 2023' || formattedDate === 'Aug 5, 2023') {
        nextThreeDates += `<h4>${formattedDate}: ${soldCountInclCA} sold (${87 - soldCountInclCA} remaining)</h4>`
      };

      totalSoldCount += soldCountInclCA;

      const rowHtml = `<tr><td>${formattedDate}</td><td>${soldCountInclCA}</td></tr>`;
      // htmlContent += rowHtml;
    });

    htmlContent += currentDate;
    htmlContent += nextThreeDates;

    const totalHtml = `<tr><th class="text-2xl>Total</th><th class="text-2xl">${totalSoldCount}/2349 (${(totalSoldCount / 2349 * 100).toFixed(2)}% of full run)</th></tr>`;
    htmlContent += totalHtml;
    htmlContent += '</table></body></html>';

    await fs.writeFile('public/index.html', htmlContent);
    console.log('HTML file written successfully.');
  } catch (error) {
    console.error(error);
  }
};

module.exports = refreshData;
