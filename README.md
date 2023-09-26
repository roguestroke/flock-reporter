## Installation
1. Clone repository 
 
        git clone https://github.com/roguestroke/flock-reporter

2. Run command 

        npm install

3. Create flock *Outgoing Webhook* using [documentation](https://dev.flock.com/webhook)


4. Modify your playwright.config.ts file to include the following:

        reporter: [
            [
                './flockReporter.ts',
                {
                    flockWebHookUrl: 
                    'https://api.flock.com/hooks/sendMessage/XXXXX-0000-TTTT-AAAAA-N000000000000' // provide flock webhook url
                }
            ],
            ['html'], //other reporters
        ],