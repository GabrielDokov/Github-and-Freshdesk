const fetch = require('node-fetch');

const GITHUB_TOKEN = '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';
const FRESHDESK_KEY = 'pJeJxG1f8JbmWClBbOOI';

const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": GITHUB_TOKEN,
    "X-GitHub-Api-Version": "2022-11-28"
};

const password = 'close123';

const authFresh = "Basic " + Buffer.from(FRESHDESK_KEY+":"+password).toString('base64')


const freshdeskHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authFresh
};

async function get_all_github_users() {
  const response = await fetch('https://api.github.com/users', { headers });
  if (response.status === 200) {
    const users = await response.json();
    return users.reduce((acc, user) => {
      acc[user.login] = user;
      return acc;
    }, {});
  } else {
    return 'Retrieving GitHub users failed';
  }
}

async function get_freshdesk_users() {
  const domain = 'https://dokov.freshdesk.com';
  const response = await fetch(domain + '/api/v2/contacts', {
    headers: freshdeskHeaders
  });
  if (response.status === 200) {
    const users = await response.json();
    return users.reduce((acc, user) => {
      acc[user.name] = user;
      return acc;
    }, {});
  } else {
    return 'Retrieving Freshdesk users failed';
  }
}

async function create_freshdesk_user(contact_info) {
  const domain = 'https://dokov.freshdesk.com';
  const response = await fetch(domain + '/api/v2/contacts', {
    method: 'POST',
   headers: freshdeskHeaders,
    body: JSON.stringify(contact_info),
  });
  if (response.status === 201) {
    return 'User Successfully Created';
  } else {
    return 'User Creation Failed';
  }
}

async function update_freshdesk_user(contact_info, id) {
  const domain = 'https://dokov.freshdesk.com';
  const response = await fetch(domain + '/api/v2/contacts/' + id, {
    method: 'PUT',
    headers: freshdeskHeaders,
    body: JSON.stringify(contact_info),
  });
  if (response.status === 200) {
    return 'Update Successful';
  } else {
    return 'Update Failed';
  }
}

async function getUserInput(prompt) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  let done = false;

  while (!done) {
    const info = ['email', 'language'];
    const githubUsers = await get_all_github_users();
    const freshdeskUsers = await get_freshdesk_users();
    const usernameInput = await getUserInput('Input Username:');

    if (!(usernameInput in githubUsers)) {
      console.log('Please enter a valid username');
    } else if (usernameInput in githubUsers && !(usernameInput in freshdeskUsers)) {
     
      // Create new contact in Freshdesk
      const contactInfo = {
        name: usernameInput,
        email: usernameInput + '@example.com',
        language: 'en',
      };
      console.log(await create_freshdesk_user(contactInfo));
    } else {
      // Update user in Freshdesk
      console.log('User already exists in Freshdesk');
      let updateInput = await getUserInput(`Would you like to update ${usernameInput}? (Yes/No):`);

      while (updateInput !== 'Yes' && updateInput !== 'No') {
        console.log('Please enter: Yes or No');
        updateInput = await getUserInput(`Would you like to update ${usernameInput}? (Yes/No):`);
      }

      if (updateInput === 'Yes') {
        const newEmail = await getUserInput('New Email:');
        const contactInfo = {
          name: usernameInput,
          email: newEmail,
          language: 'en',
        };
        const userId = freshdeskUsers[usernameInput].id;
        console.log(await update_freshdesk_user(contactInfo, userId));
      }
    }

    let moreUsers = await getUserInput('Would you like to add more users? (Yes/No):');

    while (moreUsers !== 'Yes' && moreUsers !== 'No') {
      console.log('Please enter: Yes or No');
      moreUsers = await getUserInput('Would you like to add more users? (Yes/No):');
    }

    if (moreUsers === 'No') {
      done = true;
    }
  }
}

main();
