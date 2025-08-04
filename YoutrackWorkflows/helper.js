const workflow = require('@jetbrains/youtrack-scripting-api/workflow');
const http = require('@jetbrains/youtrack-scripting-api/http');
const CONFIG = require('./config');

class Helper {
  getIssueLink(issue) {
    // example of the issue link to MyConvermax admnin panel
    // https://myconvermax.com/sdtw-direct-wholesale/support/SS-6181
    const storeId = issue.fields['Store Id']?.name.split(' (')[0];
    const ticketId = issue.id;
    return storeId && ticketId ? `https://myconvermax.com/${storeId}/support/${ticketId}` : '';
  }

  getConversationIdFromFrontlink(frontLink) {
    const pathname = URL.canParse(frontLink) ? new URL(frontLink).pathname : null;
    const conversationId = pathname?.split('/').at(-1);

    return !isNaN(Number(conversationId)) ? conversationId : null;
  }

  messageStateChanged(taskName, tasklink, taskStatus) {
    return `
      <p>Hello,</p><br>
      <p>We just wanted to let you know that the status of your task: <strong>${taskName}</strong></p>
      <p>has been changed to: <strong>${taskStatus}</strong></p>
      <p><a href="${tasklink}">${tasklink}</a></p>
      <p>Please let us know if we can help you with anything else.</p>
      <p>—<br>Regards,</p>
      <p>Convermax Support Team</p>
    `;
  }

  messageTaskCreated(taskName, taskLink) {
    return `
      <p>Hello,</p><br>
      <p>We just wanted to let you know that we put your task, <strong>${taskName}</strong>, in our list.</p>
      <p>You can track its status here:</p>
      <p><a href="${taskLink}">${taskLink}</a></p>

      <p>Please let us know if you have any questions.</p>
      <p>—<br>Regards,</p>
      <p>Convermax Support Team</p>
    `;
  }

  notification(commentText, issueDescription, issueLink, issueSummary, commentAuthor) {
    return `
    <p><a href="${issueLink}"><strong>${issueSummary}</strong></a> ticket was updated:</p>

    <p style="background-color: #f0f0f0; padding: 10px; color: #1466c6; border-radius: 5px;">
        ${commentText}
    </p>
    <p>—<br>Regards,</p>
      <p>${commentAuthor}</p>
    `;
  }

  getRecipientsFromCC(emailString) {
    return emailString.split(', ');
  }

  convertFrontAppUrl(apiUrl) {
    return `https://app.frontapp.com/open/${this.getConversationIdFromFrontlink(apiUrl)}`;
  }

  putEmailSubject(state) {
    switch (state) {
      case 'Done': {
        return 'Convermax - Task Completed';
      }
      case 'In progress': {
        return 'Convermax - Task In progress';
      }
      case 'New': {
        return 'Convermax - Task created';
      }
      default: {
        return 'Convermax - Task status updated';
      }
    }
  }

  sendEmailToConversation(message, frontConversationId) {
    const connection = new http.Connection(CONFIG.URL(frontConversationId), null);
    connection.addHeader('Content-Type', 'application/json');
    connection.addHeader('authorization', `Bearer ${CONFIG.API_TOKEN}`);

    const body = {
      body: message,
      channel_id: 'alt:address:team@convermax.com',
    };

    try {
      const response = connection.postSync('', null, JSON.stringify(body));

      if (!response.isSuccess) {
        workflow.message(`Front Message sender failed to send.\n${response.toString()}`);
      } else {
        workflow.message('Email was successfully sent');
      }
    } catch (exception) {
      workflow.message(`exception: ${exception}`);
    }
  }

  sendNewEmail(message, recipients, issue, subject = null) {
    const connection = new http.Connection(CONFIG.SEND_NEW_MESSAGE_LINK, null);
    connection.addHeader('Content-Type', 'application/json');
    connection.addHeader('authorization', `Bearer ${CONFIG.API_TOKEN}`);

    const body = {
      body: message,
      to: recipients,
      subject: subject ?? this.putEmailSubject(issue.State.name),
    };

    try {
      const response = connection.postSync('', null, JSON.stringify(body));

      if (!response.isSuccess) {
        workflow.message(`Front Message sender failed to send.\n${response.toString()}`);
      } else {
        workflow.message('Email was successfully sent');
        const rawFrontLink = JSON.parse(response.body)?._links?.related?.conversation || null;
        if (rawFrontLink) {
          issue.fields['Front Link'] = this.convertFrontAppUrl(rawFrontLink);
        }
      }
    } catch (exception) {
      workflow.message(`exception: ${exception}`);
    }
  }

  convertYoutrackToHtml(text) {
    // Convert angle bracket links to HTML
    text = text.replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1">$1</a>');

    // Convert YouTrack image syntax to HTML (basic version)
    text = text.replace(/!([^(]+)\(([^)]+)\)\{[^}]*\}/g, '<img src="$2" alt="$1" />');

    text = text.replace(/\n/g, '<br>');

    return text;
  }
}
module.exports = { Helper };
