const {Helper} = require("./helper");
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onChange({
  // TODO: give the rule a human-readable title
  title: 'Send-email-task-gets-on-work',
  guard: (ctx) => {

    const issue = ctx.issue;
    const notify = issue.fields.Notify.name === "Yes";
    const frontLink = issue.fields["Front Link"];

    return issue.fields.becomes("State", "New") && notify && frontLink;
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const helper = new Helper();
    const frontLink = issue.fields["Front Link"];

    const issueLink = helper.getIssueLink(issue);

    const message = helper.MessageTaskCreate(issue.summary, issueLink);


    if (frontLink){
      const frontConversationId = helper.GetConversationIdFromFrontlink(frontLink);
      if (frontConversationId){
        helper.SendEmailToConversation(message, frontConversationId);
      }
    }
    else{
      const recipients = helper.getRecipientsFromCC(issue.fields["CC"]);
      if(recipients){
        helper.SendNewEmail(message, recipients, issue);
      }
    }
    issue.fields.Notify = ctx.Notify.Created;
  },
  requirements:{
    Notify: {
      type: entities.EnumField.fieldType,
      name: "Notify",
      Created: {name: "Created"}
    }
  }
});
