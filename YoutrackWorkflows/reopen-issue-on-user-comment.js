const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onChange({
  title: 'Reopen ticket when reporter adds a comment',
  guard: (ctx) => {
    const { issue } = ctx;
    return (
      !issue.comments.added.isEmpty() && // check if a comment was added
      ((issue.fields.State.isResolved &&
        !(
          issue.fields.is(ctx.State, ctx.State.Duplicate) || issue.fields.is(ctx.State, ctx.State.ToDeploy)
        )) ||
        issue.fields.is(ctx.State, ctx.State.Responded)) && // check a status of the issue
      issue.comments.added.get(0).author.visibleName === 'Reporter'
    ); // check an author of the comment
  },
  action: (ctx) => {
    ctx.issue.fields.State = ctx.State.Submitted;
  },
  requirements: {
    State: {
      'type': entities.State.fieldType,
      'In Progress': {},
      'New': {},
      'Submitted': {},
      'Done': {},
      'Duplicate': {},
      'Responded': {},
      'ToDeploy': { name: 'To Deploy' },
    },
  },
});
