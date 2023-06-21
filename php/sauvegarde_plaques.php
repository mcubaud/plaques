<?php
    if ($_POST['type']=="sauvegarder_plaques") {
        file_put_contents('../plaques.geojson', $_POST['data']);
    }

?>