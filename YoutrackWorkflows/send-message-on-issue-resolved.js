const entities = require('@jetbrains/youtrack-scripting-api/entities');
const { Helper } = require('./helper');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

exports.rule = entities.Issue.onChange({
  title: 'Send-email-on-issue-resolved',
  guard: (ctx) => {
    const { issue } = ctx;
    const notifyValue = issue.fields.Notify?.name === 'Yes' || issue.fields.Notify?.name === 'Created';
    // workflow.message(issue.fields.Notify);
    return issue.fields.becomes('State', 'Done') && notifyValue;
  },
  action: (ctx) => {
    const { issue } = ctx;
    const helper = new Helper();
    const frontLink = issue.fields['Front Link'];

    // example of the issue link to MyConvermax admnin panel
    // https://myconvermax.com/sdtw-direct-wholesale/support/SS-6181

    const issueLink = helper.getIssueLink(issue);

    // issue.fields.Notify = issue.fields.Notify.bundle.values.find(value => value.name === "Done");

    const message = helper.messageStateChanged(issue.summary, issueLink, issue.State.name);

    if (frontLink) {
      const frontConversationId = helper.getConversationIdFromFrontlink(frontLink);
      if (frontConversationId) {
        helper.sendEmailToConversation(message, frontConversationId);
      }
    } else if (issue.project.name === 'Support') {
      // нужно добавить специального пользователя в агенты и писать от него
      const teamUser = entities.User.findByLogin('vasilii');

      const comment = issue.addComment(message, teamUser);
      comment.permittedUsers.clear();
      comment.permittedGroups.clear();
    } else {
      const recipients = helper.getRecipientsFromCC(issue.fields.CC);
      if (recipients) {
        helper.sendNewEmail(message, recipients, issue);
      }
    }
    issue.fields.Notify = ctx.Notify.Done;
  },
  requirements: {
    Notify: {
      type: entities.EnumField.fieldType,
      name: 'Notify',
      Done: { name: 'Done' },
    },
  },
});
