exports.pushEventSingle = function (data) {
    const repo = data.repo.name;
    const branch = data.payload.ref.split('/')[2];
    const author = data.payload.commits[0].author.name;
    const url = data.payload.commits[0].url;
    const message = data.payload.commits[0].message;
    return {
        text: `[${repo}:${branch}] 1 new commit by ${author}:
#{0}: ${message} - ${author}`,
        urls: [ createUrl(repo, data.payload.commits[0].sha) ]
    }
}

function createUrl (repo, sha) {
    return `https://github.com/${repo}/commits/${sha}`
}
