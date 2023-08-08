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

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const nextThreeDates = [
      new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
      new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    ];

    let ticketsSoldByDate = {};  // Stores tickets sold for each date
    let totalSoldCount = 0;

    rows.forEach(row => {
      const date = new Date(row[6]);
      date.setHours(0, 0, 0, 0);
      const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const soldCountInclCA = parseInt(row[14]);

      if (!ticketsSoldByDate[formattedDate]) {
        ticketsSoldByDate[formattedDate] = 0;
      }
      ticketsSoldByDate[formattedDate] += soldCountInclCA;

      totalSoldCount += soldCountInclCA;
    });

    let todayOutput = `<h1 class="text-2xl">Today</h1>`;
    const formattedCurrentDate = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    if (ticketsSoldByDate[formattedCurrentDate]) {
      todayOutput += `<h2>${ticketsSoldByDate[formattedCurrentDate]} sold (${87 - ticketsSoldByDate[formattedCurrentDate]} remaining)</h2>`;
    }

    let nextThreeOutput = `<h3 class="text-2xl">Next three shows</h3>`;
    for (const nextDate of nextThreeDates) {
      const formattedNextDate = nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      if (ticketsSoldByDate[formattedNextDate]) {
        nextThreeOutput += `<h4>${formattedNextDate}: ${ticketsSoldByDate[formattedNextDate]} sold (${87 - ticketsSoldByDate[formattedNextDate]} remaining)</h4>`;
      }
    }

    const formattedTime = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
    let htmlContent = `
      <html>
        <head>
          <link rel="stylesheet" href="/output.css">
        </head>
        <body class="text-2xl">
          <p>Last refreshed: ${formattedTime}</p><table>
    `;

    htmlContent += todayOutput;
    htmlContent += nextThreeOutput;

    const totalHtml = `<tr><th class="text-2xl red">Total: ${totalSoldCount}/2349 (${(totalSoldCount / 2349 * 100).toFixed(2)}% of full run)</th></tr>`;
    htmlContent += totalHtml;
    htmlContent += '</table></body></html>';

    await fs.writeFile('public/index.html', htmlContent);
    console.log('HTML file written successfully.');
  } catch (error) {
    console.error(error);
  }
};

module.exports = refreshData;
