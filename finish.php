<?php
   header('Content-Type: application/json');
   $json = $_POST['json'];
   $jencode = json_decode($json, true);
   if ($jencode != null) {
       if (!array_key_exists('participant', $jencode)) {
           http_response_code(400);
           echo json_encode(array("error" => "Study is not complete."));
           exit();
       }
       
       /*
       try {
           file_put_contents('raw-data/pid-'.$jencode['participant'].'.json', json_encode($jencode));
       } catch (Exception $err) {
           http_response_code(500);
           echo json_encode(array("error" => "Could not save participant data file."));
           exit();
       }       
       */
       
       $forcsv = '';
       foreach($jencode['data'] as &$data){
            $forcsv = $forcsv.'"'.$jencode['participant'].'","'.$data['type'].'","'.$data['conditionOrder'].'","'.$data['width'].'","'.$data['distance'].'","'.$data['time'].'"'.PHP_EOL;
       }
                     
       try {
           file_put_contents('master.csv', $forcsv, FILE_APPEND);
       } catch (Exception $err) {
           http_response_code(500);
           echo json_encode(array("error" => "Could not update master spreadsheet file."));
           exit();
       }
       
       
       try {
           $master = array_map('str_getcsv', file('master.csv'));
       } catch (Exception $err) {
           http_response_code(500);
           echo json_encode(array("error" => "Could not read master spreadsheet file."));
           exit();
       }
       
       echo json_encode(array("success"=>"Data succesfully submitted.","firstppdata"=> array_slice($master,1,50)));
    }
   else {
       http_response_code(400);
       echo json_encode(array("error" => "No parseable JSON received."));
       exit();
   }
?>