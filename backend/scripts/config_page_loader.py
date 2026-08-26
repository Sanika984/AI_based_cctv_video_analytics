import json
import os


class Config_Loader():
    def __init__(self, config_file_path):
        self.config_file_path = config_file_path
        self.data = {}
        self.load_config() 
        return
    
    # Reads and returns full cameras.json
    def load_config(self):
        if not os.path.exists(self.config_file_path):
            self.data = {"store": {}, "cameras": []}
            return self.data
        with open(self.config_file_path, 'r') as file:
            self.data = json.load(file)
        return self.data

    # Returns store name, id
    def get_store_info(self):
        return self.data['store']

    # Returns all cameras
    def get_all_cameras(self):
        return self.data['cameras']

    # Returns cameras filtered by module
    def get_cameras_by_module(self, module):  
        cameras = []
        for camera in self.data['cameras']:
            if camera['module'] == module:
                cameras.append(camera)
        return cameras

    # Returns only active cameras
    def get_active_cameras(self):
        cameras = []
        for camera in self.data['cameras']:
            if camera['status'] == 'active':
                cameras.append(camera)
        return cameras

    # Returns one specific camera
    def get_camera_by_id(self, camera_id):
        for camera in self.data['cameras']:
            if camera['camera_id'] == camera_id:
                return camera
        return None

    # Writes updated data back to cameras.json used by Add Camera form
    def save_config(self, data):
        self.data = data
        with open(self.config_file_path, 'w') as file:
            json.dump(data, file, indent=4)
    
    
    
if __name__ == "__main__":
    # Get path of file
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    CONFIG_PATH = os.path.join(BASE_DIR, "config", "cameras.json")
    
    ConfigObject = Config_Loader(config_file_path=CONFIG_PATH)

    print('-'*50)
    print('CAMERA BY MODULE')
    print('-'*50)
    camera_customer = ConfigObject.get_cameras_by_module(module='customer_analytics')
    print(json.dumps(camera_customer, indent=4))
    
    print('-'*50)
    print('CAMERA BY ID')
    print('-'*50)
    camera_by_id = ConfigObject.get_camera_by_id(camera_id='CAM_001')
    print(json.dumps(camera_by_id, indent=4))
    
    print('-'*50)
    print('ACTIVE CAMERAS')
    print('-'*50)
    camera_ac = ConfigObject.get_active_cameras()
    print(json.dumps(camera_ac, indent=4))
