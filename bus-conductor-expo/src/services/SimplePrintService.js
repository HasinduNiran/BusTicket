import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

class SimplePrintService {
  // Generate HTML for ticket printing
  generateTicketHTML(ticket) {
    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (amount) => {
      return `Rs. ${amount.toFixed(2)}`;
    };

    const sectionsCount = Math.abs((ticket.toStop?.sectionNumber || 0) - (ticket.fromStop?.sectionNumber || 0));

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bus Ticket - ${ticket.ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background-color: white;
          line-height: 1.4;
        }
        .ticket {
          border: 2px solid #000;
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        .ticket-title {
          font-size: 14px;
          margin: 5px 0 0 0;
        }
        .ticket-number {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
          padding: 8px;
          border: 1px solid #000;
        }
        .journey-info {
          margin: 15px 0;
          text-align: center;
        }
        .stops {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
        }
        .stop {
          flex: 1;
          text-align: center;
        }
        .stop-label {
          font-size: 12px;
          font-weight: bold;
        }
        .stop-name {
          font-size: 14px;
          margin: 2px 0;
        }
        .section {
          font-size: 10px;
        }
        .arrow {
          font-size: 20px;
          margin: 0 10px;
        }
        .details {
          margin: 15px 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 10px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .fare-section {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 15px 0;
          padding: 10px;
          border: 2px solid #000;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 15px;
          border-top: 1px solid #000;
          padding-top: 10px;
        }
        .tear-line {
          text-align: center;
          margin: 15px 0;
          font-size: 10px;
        }
        @media print {
          body { background-color: white; }
          .ticket { border: 1px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h1 class="company-name">BUS TICKET SYSTEM</h1>
          <p class="ticket-title">PASSENGER TICKET</p>
        </div>

        <div class="ticket-number">
          Ticket: ${ticket.ticketNumber}
        </div>

        <div class="journey-info">
          <div class="stops">
            <div class="stop">
              <div class="stop-label">FROM</div>
              <div class="stop-name">${ticket.fromStop?.stopName}</div>
              <div class="section">Section ${ticket.fromStop?.sectionNumber}</div>
            </div>
            <div class="arrow">→</div>
            <div class="stop">
              <div class="stop-label">TO</div>
              <div class="stop-name">${ticket.toStop?.stopName}</div>
              <div class="section">Section ${ticket.toStop?.sectionNumber}</div>
            </div>
          </div>
        </div>

        <div class="details">
          <div class="detail-row">
            <span>Route:</span>
            <span>${ticket.routeId?.routeName || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span>Bus Number:</span>
            <span>${ticket.busNumber}</span>
          </div>
          <div class="detail-row">
            <span>Passengers:</span>
            <span>${ticket.passengerCount}</span>
          </div>
          <div class="detail-row">
            <span>Sections:</span>
            <span>${sectionsCount}</span>
          </div>
          <div class="detail-row">
            <span>Direction:</span>
            <span>${ticket.direction?.toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span>Payment:</span>
            <span>${ticket.paymentMethod?.toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span>Issue Date:</span>
            <span>${formatDate(ticket.issueDate)}</span>
          </div>
          <div class="detail-row">
            <span>Conductor:</span>
            <span>${ticket.conductorId?.username || 'N/A'}</span>
          </div>
        </div>

        <div class="fare-section">
          TOTAL FARE: ${formatCurrency(ticket.fare)}
        </div>

        <div class="footer">
          <p>Please keep this ticket during your journey</p>
          <p>Thank you for traveling with us!</p>
        </div>

        <div class="tear-line">
          - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Print ticket
  async printTicket(ticket) {
    try {
      const html = this.generateTicketHTML(ticket);
      
      await Print.printAsync({
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Failed to print ticket. Please try again.');
      return { success: false, error: error.message };
    }
  }

  // Download ticket as PDF
  async downloadTicket(ticket) {
    try {
      const html = this.generateTicketHTML(ticket);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Ticket',
          UTI: 'com.adobe.pdf',
        });
      }

      Alert.alert('Success', 'Ticket downloaded successfully!');
      return { success: true, uri };
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', 'Failed to download ticket. Please try again.');
      return { success: false, error: error.message };
    }
  }
}

export default new SimplePrintService();