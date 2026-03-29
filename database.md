Table cameras {
  camera_id varchar [primary key]
  name      text    [not null]
  location  text    [not null]
  location_type text [not null]
  source    text    [not null]
  status    text    [not null]
  created_at datetime [not null]
}

Table camera_metadata {
  id        varchar [primary key]
  camera_id varchar [unique, not null]
  floor     integer
  description text
  zone      text
}

Table camera_modules {
  id          varchar [primary key]
  camera_id   varchar [not null]
  module_name text    [not null]
  is_enabled  boolean [not null]
}

Table camera_features {
  id           varchar [primary key]
  camera_id    varchar [not null]
  feature_name text    [not null]
  is_enabled   boolean [not null]
}

Ref: camera_metadata.camera_id - cameras.camera_id   // one to one
Ref: camera_modules.camera_id > cameras.camera_id    // many to one
Ref: camera_features.camera_id > cameras.camera_id   // many to one


Table alerts {
  alert_id         varchar  [primary key]
  camera_id        varchar  [not null]
  module           text     [not null]  
  alert_type       text     [not null]  
  severity         text     [not null]  
  status           text     [not null]  
  timestamp        datetime [not null]
  acknowledged_by  text                
  acknowledged_at  datetime            
}

Table security_alert_details {
  id               varchar  [primary key]
  alert_id         varchar  [not null]
  snapshot_path    text                 
  confidence_score real            
  detection_type   text              
}

Table vehicle_alert_details {
  id               varchar  [primary key]
  alert_id         varchar  [not null]
  plate_number     text
  direction        text            
  vehicle_type     text               
}

Table customer_alert_details {
  id               varchar  [primary key]
  alert_id         varchar  [not null]
  people_count     integer
  threshold        integer        
  zone             text                 
}

Ref: alerts.camera_id > cameras.camera_id
Ref: security_alert_details.alert_id - alerts.alert_id
Ref: vehicle_alert_details.alert_id - alerts.alert_id
Ref: customer_alert_details.alert_id - alerts.alert_id


Table vehicle_logs {
  log_id           varchar  [primary key]
  camera_id        varchar  [not null]
  plate_number     text     [not null]
  event_type       text     [not null] 
  confidence_score real                
  timestamp        datetime [not null]
  is_blacklisted   boolean  [not null, default: false]
}

Table blacklisted_vehicles {
  id               varchar  [primary key]
  plate_number     text     [not null, unique]
  reason           text                
  added_by         text              
  added_at         datetime [not null]
  is_active        boolean  [not null, default: true]
}

Ref: vehicle_logs.camera_id > cameras.camera_id