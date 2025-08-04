const { Helper } = require('./helper');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onChange({
  title: 'Send-email-task-gets-on-work',
  guard: (ctx) => {
    const { issue } = ctx.issue;
    const notify = issue.fields.Notify.name === 'Yes';
    const frontLink = issue.fields['Front Link'];

    return issue.fields.becomes('State', 'New') && notify && frontLink;
  },
  action: (ctx) => {
    const { issue } = ctx.issue;
    const frontLink = issue.fields['Front Link'];

    const issueLink = Helper.getIssueLink(issue);

    const message = Helper.messageTaskCreated(issue.summary, issueLink);

    if (frontLink) {
      const frontConversationId = Helper.getConversationIdFromFrontlink(frontLink);
      if (frontConversationId) {
        Helper.sendEmailToConversation(message, frontConversationId);
      }
    } else {
      const recipients = Helper.getRecipientsFromCC(issue.fields.CC);
      if (recipients) {
        Helper.sendNewEmail(message, recipients, issue);
      }
    }
    issue.fields.Notify = ctx.Notify.Created;
  },
  requirements: {
    Notify: {
      type: entities.EnumField.fieldType,
      name: 'Notify',
      Created: { name: 'Created' },
    },
  },
});
