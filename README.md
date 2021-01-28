# Fitts Law Web-task
This task is a heavily adapted version of a Fitts Law task [from the University of Copenhagen
](https://github.com/SimonWallner/uit-fitts-law)

## Setup
- You will need a webserver set-up on your local machine or server.
- Your webserver will need to be able to get PHP files parsed.
- You webserver will need write access to the directory you're serving from.

## Operation and configuration
Once you have a webserver succesfully serving the page you will see the index.html file being rendered – this is what participants should be pointed toward.

Once participants have completed the task, their data are POSTed to the `finish.php` file. This processes the data and writes it to a CSV file, `master.csv' in the root of the serving directory.

If the `master.csv` file already exists, the new data will be appended to the file.

Pointing a browser at `admin.php` brings up the admin interface. Here the `master.csv` file can be downloaded and any existing data wiped.

Note that the `master.csv` file is not protected from read access in any way; it can be downloaded directly. Wiping of data does required a password, which is hard-coded into `admin.php`. 

### js/fitts-law.js
This Javascript file controls the task and the upload of the data from it. The most important configurable aspects of this file relate to the creation of trials:
```
var conditions = _.shuffle([{
    width: 35,
    distance: 275,
    type: 'experimental'
}, {
    width: 55,
    distance: 275,
    type: 'experimental'
}, {
    width: 35,
    distance: 325,
    type: 'experimental'
}, {
    width: 55,
    distance: 325,
    type: 'experimental'
}]);
conditions.unshift({
    width: 60,
    distance: 200,
    type: 'training'
});
```
This is programmed with four experimental trials that vary the width of the target and the distance between them. By default `lodash.shuffle()` is called on these trials so that their order is randomised. 

After the experimental trials, a training trial as added to the front of the list of trials. The `type` property of the trial objects is recorded in a column in the output so that training and experimental trials can be distinguished.

The experiment can be changed by adjusting the `width` and `distance` parameters to something else. The current design of experiment is 2x2, with width (35,55) and distance (200,325) being varied. A variety of designs can be created by adjusting these parameters. Note that only one trial of each trial object is set. Therefore, to build a bigger sample, multiple trial objects should be created.

Other configurable parameters can be found throught the file:
```
 isoParams: {
  num: 9,
  distance: conditions[currentCondition].distance,
  width: conditions[currentCondition].width
 },
 ```
Here `num` is the number of possible targets that appear on the screen at any moment. It is set to 9 by default.

The `MAX_TIME` constant is a number of milliseconds. Any trials exceeding this time limit will be dropped as outliers (e.g., if a participant got distracted during the trial).
The `CLICKS_PER_TRIAL' constant represents the number of `clicks' in a given task. Note that a first click is required to 'start' the trial, so the number of clicks in each trial is actually `CLICKS_PER_TRIAL + 1`. 

### admin.php
The main configuration change that can be made here is to the password. By default the password is 'password' by adjusting the comparison:
```
$_POST['password'] == 'delete'
```
And replacing delete with some other string, the password can be changed.

### finish.php
You can edit this file to adjust where the `master.csv` file gets stored and what it is named. Note that if you change the name or path, you will need to update other files – the `master.csv` filename is hardcoded throughout. 

