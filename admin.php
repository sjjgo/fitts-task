<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
    <title>Fitts' Law Administration</title>
    <link type="text/css" rel="stylesheet" href="css/reset.css" />
    <link type="text/css" rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="container">
        <h1>Fitts' Law Lab Administration</h1>
        <p><a class="button-data" download="all-participants.csv" href="master.csv" target="_blank">Download raw data for all participants</a></p>
        <form method="post" action="admin.php">
        <p>Reset password: <input type="password" name="password"></p>
        <p><button action="submit">Reset all data</button></p>
        </form>
        
        <p>
            <?php 
                if(isset($_POST['password'])){
                    if($_POST['password'] == 'delete'){
                        file_put_contents('master.csv','"Participant","Type","RoundNum","Width","Distance","Time"'.PHP_EOL);
                        echo "Master spreadsheet has been reset.";     
                    }
                    else{
                        echo "That's not the password.";
                    }

                }
            ?>
        </p>
    </div>
</body>

</html>