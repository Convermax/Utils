const { Helper } = require('./helper');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onChange({
  title: 'Send-email-task-gets-on-work',
  guard: (ctx) => {
    const { issue } = ctx;
    const notify = issue.fields.Notify.name === 'Yes';
    const frontLink = issue.fields['Front Link'];

    return issue.fields.becomes('State', 'New') && notify && frontLink;
  },
  action: (ctx) => {
    const { issue } = ctx;
    const helper = new Helper();
    const frontLink = issue.fields['Front Link'];

    const issueLink = helper.getIssueLink(issue);

    const message = helper.messageTaskCreated(issue.summary, issueLink);

    if (frontLink) {
      const frontConversationId = helper.getConversationIdFromFrontlink(frontLink);
      if (frontConversationId) {
        helper.sendEmailToConversation(message, frontConversationId);
      }
    } else {
      const recipients = helper.getRecipientsFromCC(issue.fields.CC);
      if (recipients) {
        helper.sendNewEmail(message, recipients, issue);
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
